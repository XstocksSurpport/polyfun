"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useWallet, type Eip6963ProviderDetail } from "@/providers/WalletProvider";
import { walletConnectProjectId } from "@/lib/config";
import { truncateAddress } from "@/lib/utils";

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
  connectInjected,
  connectWalletConnect,
}: {
  open: boolean;
  onClose: () => void;
  connecting: boolean;
  providers: Eip6963ProviderDetail[];
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-900/30 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[min(520px,90vh)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white/95 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <span className="text-sm font-semibold">Connect</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-xl text-neutral-400 hover:bg-neutral-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-3 py-3">
          {wallets.length === 0 && !walletConnectProjectId ? (
            <p className="px-3 py-6 text-center text-sm text-neutral-500">
              Install MetaMask, then refresh.
            </p>
          ) : null}
          <ul className="space-y-1">
            {wallets.map((p) => (
              <li key={p.info.uuid}>
                <button
                  type="button"
                  disabled={connecting}
                  onClick={async () => {
                    await connectInjected(p);
                    onClose();
                  }}
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-neutral-50 disabled:opacity-40"
                >
                  {p.info.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.info.icon} alt="" className="h-9 w-9 rounded-lg border object-contain" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-xs">
                      W
                    </span>
                  )}
                  <span className="text-sm font-medium">{p.info.name}</span>
                </button>
              </li>
            ))}
            {walletConnectProjectId ? (
              <li>
                <button
                  type="button"
                  disabled={connecting}
                  onClick={async () => {
                    await connectWalletConnect();
                    onClose();
                  }}
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-neutral-50 disabled:opacity-40"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-xs font-semibold">
                    WC
                  </span>
                  <span className="text-sm font-medium">WalletConnect</span>
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
  const { address, connecting, getProviders, connectInjected, connectWalletConnect, disconnect } =
    useWallet();
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  if (address) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        className="inline-flex h-10 items-center rounded-xl border border-zinc-200/80 bg-white px-4 text-sm font-medium text-zinc-800 shadow-sm transition-all hover:bg-zinc-50"
      >
        {truncateAddress(address)}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={connecting}
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all hover:bg-zinc-800 disabled:opacity-40"
      >
        {connecting ? "..." : "Connect wallet"}
      </button>
      <WalletModal
        open={open}
        onClose={close}
        connecting={connecting}
        providers={open ? getProviders() : []}
        connectInjected={connectInjected}
        connectWalletConnect={connectWalletConnect}
      />
    </>
  );
}

export const ConnectButton = memo(ConnectButtonInner);
