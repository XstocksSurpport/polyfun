"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useWallet, type Eip6963ProviderDetail } from "@/providers/WalletProvider";
import { walletConnectProjectId } from "@/lib/config";
import { formatWalletError } from "@/lib/trade-errors";
import { truncateAddress } from "@/lib/utils";
import { buttonClassName } from "@/components/ui/Button";

const WALLET_ORDER = [
  "io.metamask",
  "com.coinbase.wallet",
  "io.rabby",
  "com.brave.wallet",
  "app.phantom",
  "com.trustwallet.app",
];

function sortProviders<T extends { info: { rdns: string; name: string } }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const ai = WALLET_ORDER.indexOf(a.info.rdns);
    const bi = WALLET_ORDER.indexOf(b.info.rdns);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return a.info.name.localeCompare(b.info.name);
  });
}

function WalletModal({
  open,
  onClose,
  connecting,
  providers,
  connectError,
  connectInjected,
  connectWalletConnect,
}: {
  open: boolean;
  onClose: () => void;
  connecting: boolean;
  providers: Eip6963ProviderDetail[];
  connectError: string | null;
  connectInjected: (detail: Eip6963ProviderDetail) => Promise<void>;
  connectWalletConnect: () => Promise<void>;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const wallets = sortProviders(providers);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[min(520px,90vh)] w-full max-w-md flex-col overflow-hidden rounded-ui border border-zinc-200 bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <span className="text-meta font-medium uppercase tracking-wide">Connect wallet</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-lg text-[#6B7280] hover:bg-zinc-50 hover:text-[#111111]"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-2 py-2">
          {connectError ? (
            <p className="mx-2 mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{connectError}</p>
          ) : null}
          {wallets.length === 0 && !walletConnectProjectId ? (
            <p className="px-3 py-6 text-center text-meta">Install MetaMask, then refresh.</p>
          ) : null}
          <ul className="space-y-0.5">
            {wallets.map((p) => (
              <li key={p.info.uuid}>
                <button
                  type="button"
                  disabled={connecting}
                  onClick={() => void connectInjected(p)}
                  className="flex min-h-10 w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-zinc-50 disabled:opacity-40"
                >
                  {p.info.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.info.icon} alt="" className="h-8 w-8 rounded-full border border-zinc-200 object-contain" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-[10px]">
                      W
                    </span>
                  )}
                  <span className="text-sm font-medium text-[#111111]">{p.info.name}</span>
                </button>
              </li>
            ))}
            {walletConnectProjectId ? (
              <li>
                <button
                  type="button"
                  disabled={connecting}
                  onClick={() => void connectWalletConnect()}
                  className="flex min-h-10 w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-zinc-50 disabled:opacity-40"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold">
                    WC
                  </span>
                  <span className="text-sm font-medium text-[#111111]">WalletConnect</span>
                </button>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ConnectButtonInner() {
  const { address, connecting, restoring, getProviders, connectInjected, connectWalletConnect } =
    useWallet();
  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState<Eip6963ProviderDetail[]>([]);
  const [connectError, setConnectError] = useState<string | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setConnectError(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    const refresh = () => setProviders(getProviders());
    refresh();
    const id = window.setInterval(refresh, 250);
    const stop = window.setTimeout(() => window.clearInterval(id), 2500);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(stop);
    };
  }, [open, getProviders]);

  const handleInjected = useCallback(
    async (detail: Eip6963ProviderDetail) => {
      setConnectError(null);
      try {
        await connectInjected(detail);
        close();
      } catch (e) {
        setConnectError(formatWalletError(e));
      }
    },
    [close, connectInjected]
  );

  const handleWalletConnect = useCallback(async () => {
    setConnectError(null);
    try {
      await connectWalletConnect();
      close();
    } catch (e) {
      setConnectError(formatWalletError(e));
    }
  }, [close, connectWalletConnect]);

  if (address) {
    return (
      <a
        href="/portfolio"
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 bg-white pl-1 pr-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-50 sm:pr-2.5"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-zinc-900 text-[10px] font-medium text-zinc-50">
          {address.slice(2, 4).toUpperCase()}
        </span>
        <span className="hidden sm:inline">{truncateAddress(address)}</span>
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={connecting}
        onClick={() => setOpen(true)}
        className={buttonClassName("primary", "sm", "h-8 shrink-0 px-3")}
      >
        {connecting || restoring ? "…" : "Connect"}
      </button>
      <WalletModal
        open={open}
        onClose={close}
        connecting={connecting}
        providers={providers}
        connectError={connectError}
        connectInjected={handleInjected}
        connectWalletConnect={handleWalletConnect}
      />
    </>
  );
}

export const ConnectButton = memo(ConnectButtonInner);
