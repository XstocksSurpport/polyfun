"use client";

import { useCallback, useEffect, useState } from "react";
import { JsonRpcProvider } from "ethers";
import { useRouter } from "next/navigation";
import { contracts, getConfigError, CHAIN_ID, rpcUrl } from "@/lib/config";
import { launcherAbi } from "@/lib/abis";
import { getContract } from "@/lib/ethers/contract";
import { useWallet } from "@/providers/WalletProvider";
import { FEES, MIGRATION } from "@/lib/protocol";
import { formatEth } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { PpppBadge } from "@/components/ui/PpppBadge";
import { SetupBlock } from "@/components/ui/State";

export function LaunchForm() {
  const router = useRouter();
  const { address, signer } = useWallet();
  const configError = getConfigError();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [proposition, setProposition] = useState("");
  const [burnPolyfun, setBurnPolyfun] = useState(false);
  const [salt, setSalt] = useState<string | null>(null);
  const [predictedAddress, setPredictedAddress] = useState("");
  const [vanityError, setVanityError] = useState<string | null>(null);
  const [vanityLoading, setVanityLoading] = useState(false);
  const [creationFee, setCreationFee] = useState<bigint | null>(null);
  const [pending, setPending] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  useEffect(() => {
    if (!contracts.launcher) return;
    const provider = new JsonRpcProvider(rpcUrl, CHAIN_ID);
    const contract = getContract(contracts.launcher, launcherAbi, provider);
    contract.quoteCreationFee(burnPolyfun).then(setCreationFee).catch(() => setCreationFee(FEES.deployWei));
  }, [burnPolyfun]);

  useEffect(() => {
    if (!contracts.launcher || !salt) return;
    const provider = new JsonRpcProvider(rpcUrl, CHAIN_ID);
    const contract = getContract(contracts.launcher, launcherAbi, provider);
    contract.predictTokenAddress(salt).then(setPredictedAddress).catch(() => setPredictedAddress(""));
  }, [salt]);

  const requestVanitySalt = useCallback(async () => {
    if (!address) {
      setVanityError("Connect wallet first");
      return;
    }
    if (!symbol.trim()) {
      setVanityError("Enter symbol first");
      return;
    }
    setVanityLoading(true);
    setVanityError(null);
    setSalt(null);
    setPredictedAddress("");
    try {
      const res = await fetch("/api/vanity/salt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creator: address, chainId: CHAIN_ID }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "VANITY_FAILED");
      setSalt(data.salt);
      if (data.predictedAddress) setPredictedAddress(data.predictedAddress);
    } catch (e) {
      setVanityError(e instanceof Error ? e.message : "VANITY_FAILED");
    } finally {
      setVanityLoading(false);
    }
  }, [address, symbol]);

  const handleLaunch = async () => {
    if (!address) {
      setLaunchError("Connect wallet first");
      return;
    }
    if (!name.trim() || !symbol.trim()) {
      setLaunchError("Name and symbol required");
      return;
    }
    if (!salt) {
      setLaunchError("Generate salt first");
      return;
    }
    if (!signer || !contracts.launcher) return;
    setPending(true);
    setLaunchError(null);
    try {
      const metaRes = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, symbol, proposition, description: proposition }),
      });
      const meta = await metaRes.json();
      if (!metaRes.ok) throw new Error(meta.error ?? "METADATA_FAILED");

      const fee = creationFee ?? FEES.deployWei;
      const contract = getContract(contracts.launcher, launcherAbi, signer);
      const tx = await contract.createLaunch(
        {
          name,
          symbol,
          metadataHash: meta.metadataHash,
          initialLiquidity: 0n,
          burnPolyfun,
        },
        salt,
        { value: fee }
      );
      await tx.wait();
      router.push("/");
    } catch (e) {
      setLaunchError(e instanceof Error ? e.message : "LAUNCH_FAILED");
    } finally {
      setPending(false);
    }
  };

  if (configError) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <SetupBlock />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Launch</h1>

      <div className="space-y-4">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Symbol">
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            maxLength={8}
            className={inputClass}
          />
        </Field>
        <Field label="Proposition">
          <textarea
            value={proposition}
            onChange={(e) => setProposition(e.target.value)}
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </Field>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-xs text-neutral-500">
        <div>
          <dt>Supply</dt>
          <dd className="tabular-nums text-neutral-900">1B</dd>
        </div>
        <div>
          <dt>Internal</dt>
          <dd className="tabular-nums text-neutral-900">80%</dd>
        </div>
        <div>
          <dt>LP reserve</dt>
          <dd className="tabular-nums text-neutral-900">20%</dd>
        </div>
        <div>
          <dt>YES target</dt>
          <dd className="tabular-nums text-neutral-900">{formatEth(MIGRATION.yesTargetWei, 0)}</dd>
        </div>
      </dl>

      <div className="rounded-xl border border-neutral-100 p-4 space-y-3">
        {predictedAddress ? <PpppBadge address={predictedAddress} showFull /> : null}
        {vanityError && <p className="text-xs text-no">{vanityError}</p>}
        <Button
          variant="secondary"
          size="sm"
          disabled={vanityLoading}
          onClick={requestVanitySalt}
        >
          {vanityLoading ? "..." : "Salt"}
        </Button>
        {!address && (
          <p className="text-xs text-neutral-400">Connect wallet to generate pppp salt</p>
        )}
      </div>

      <div className="flex justify-between text-sm text-neutral-500">
        <span>Deploy</span>
        <span className="tabular-nums text-neutral-900">{formatEth(creationFee ?? FEES.deployWei)}</span>
      </div>

      {launchError && <p className="text-xs text-no">{launchError}</p>}

      <Button
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={handleLaunch}
      >
        {pending ? "..." : "Launch"}
      </Button>
      {!salt && address && (
        <p className="text-center text-xs text-neutral-400">Tap Salt before launch</p>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-neutral-400">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-neutral-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-300";
