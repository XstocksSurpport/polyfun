"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useWallet } from "@/providers/WalletProvider";
import { walletConnectProjectId } from "@/lib/config";
import { truncateAddress } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

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
  providers: ReturnType<typeof useWallet>["providers"];
  connectInjected: ReturnType<typeof useWallet>["connectInjected"];
  connectWalletConnect: ReturnType<typeof useWallet>["connectWalletConnect"];
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Wallet"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="absolute inset-0 bg-neutral-900/30 backdrop-blur-[2px]"
        aria-hidden
      />
      <div className="relative z-10 flex max-h-[min(520px,90vh)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-2xl shadow-neutral-900/10">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-5 py-4">
          <span className="text-sm font-semibold text-neutral-900">Connect</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          {wallets.length === 0 && !walletConnectProjectId ? (
            <p className="px-3 py-6 text-center text-sm text-neutral-500">
              Install MetaMask or another wallet extension, then refresh.
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
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {p.info.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.info.icon}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-lg border border-neutral-100 bg-white object-contain p-0.5"
                    />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-100 bg-neutral-50 text-xs font-medium text-neutral-500">
                      W
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900">
                    {p.info.name}
                  </span>
                </button>
              </li>
            ))}
            {walletConnectProjectId && (
              <li>
                <button
                  type="button"
                  disabled={connecting}
                  onClick={async () => {
                    await connectWalletConnect();
                    onClose();
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-100 bg-neutral-50 text-[10px] font-semibold text-neutral-600">
                    WC
                  </span>
                  <span className="text-sm font-medium text-neutral-900">WalletConnect</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ConnectButton() {
  const {
    address,
    connecting,
    providers,
    connectInjected,
    connectWalletConnect,
    disconnect,
  } = useWallet();
  const [open, setOpen] = useState(false);

  if (address) {
    return (
      <Button variant="secondary" size="sm" onClick={() => disconnect()}>
        {truncateAddress(address)}
      </Button>
    );
  }

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)} disabled={connecting}>
        {connecting ? "..." : "Connect"}
      </Button>
      <WalletModal
        open={open}
        onClose={() => setOpen(false)}
        connecting={connecting}
        providers={providers}
        connectInjected={connectInjected}
        connectWalletConnect={connectWalletConnect}
      />
    </>
  );
}
