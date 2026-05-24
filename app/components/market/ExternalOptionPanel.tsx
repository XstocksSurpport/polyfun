"use client";

import { useEffect, useState } from "react";
import type { Market } from "@/lib/types";
import { EXTERNAL_OPTION, formatUsd } from "@/lib/external-option";
import { useWallet } from "@/providers/WalletProvider";
import { Button } from "@/components/ui/Button";

interface OptionState {
  roundEndsAt: number | null;
  currentMcapUsd: number | null;
  targetMcapUsd: number | null;
  windowDays: number;
  configured: boolean;
}

interface ExternalOptionPanelProps {
  market: Market;
}

const QUICK = [0.01, 0.05, 0.1];

export function ExternalOptionPanel({ market }: ExternalOptionPanelProps) {
  const { address, signer } = useWallet();
  const [side, setSide] = useState<"up" | "down">("up");
  const [amount, setAmount] = useState(0.01);
  const [state, setState] = useState<OptionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/markets/${market.address}/option`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "LOAD_FAILED");
        if (!cancelled) setState(data.option);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "LOAD_FAILED");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [market.address]);

  const handleBet = async () => {
    if (!signer || !address) return;
    setPending(true);
    setError("OPTION_CONTRACT_MISSING");
    setPending(false);
  };

  if (loading) return <div className="py-8 text-center text-sm text-neutral-300">...</div>;
  if (error && !state) return <p className="text-xs text-neutral-600">{error}</p>;

  const endsAt = state?.roundEndsAt;
  const remaining =
    endsAt && endsAt * 1000 > Date.now()
      ? Math.max(0, Math.floor((endsAt * 1000 - Date.now()) / 86400000))
      : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-900">Option</span>
        <span className="text-xs tabular-nums text-neutral-400">
          {EXTERNAL_OPTION.windowDays}d · 2x
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-neutral-400">MCap</dt>
          <dd className="tabular-nums text-neutral-900">
            {state?.currentMcapUsd ? formatUsd(state.currentMcapUsd) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-400">Target</dt>
          <dd className="tabular-nums text-neutral-900">
            {state?.targetMcapUsd ? formatUsd(state.targetMcapUsd) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-400">Left</dt>
          <dd className="tabular-nums text-neutral-900">
            {remaining !== null ? `${remaining}d` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-400">Fee share</dt>
          <dd className="tabular-nums text-neutral-900">
            {EXTERNAL_OPTION.winnerFeeShareBps / 100}%
          </dd>
        </div>
      </dl>

      <div className="grid grid-cols-2 gap-3">
        {(["up", "down"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className={`rounded-xl border p-3 text-sm font-medium ${
              side === s
                ? s === "up"
                  ? "border-neutral-300 bg-neutral-100 text-neutral-900"
                  : "border-neutral-300 bg-neutral-100 text-neutral-600"
                : "border-neutral-100 text-neutral-600"
            }`}
          >
            {s === "up" ? "BREAK" : "FAIL"}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {QUICK.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setAmount(v)}
            className={`flex-1 rounded-lg border py-2 text-sm tabular-nums ${
              amount === v
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-100 text-neutral-600"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-neutral-600">{error}</p>}

      <Button
        variant={side === "up" ? "yes" : "no"}
        size="lg"
        className="w-full"
        disabled={!address || pending || !state?.configured}
        onClick={handleBet}
      >
        {pending ? "..." : !state?.configured ? "PENDING" : `${side === "up" ? "BREAK" : "FAIL"} · ${amount}`}
      </Button>
    </div>
  );
}
