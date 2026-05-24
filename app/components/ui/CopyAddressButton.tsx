"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M4.5 10.5h-1a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v1"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        d="M4 8.5 6.5 11 12 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface CopyAddressButtonProps {
  address: string;
  className?: string;
}

export function CopyAddressButton({ address, className }: CopyAddressButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [address]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded border border-zinc-200 text-zinc-400 transition-colors",
        "hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-700",
        copied && "border-zinc-300 bg-zinc-50 text-zinc-900",
        className
      )}
      aria-label={copied ? "Copied" : "Copy contract address"}
    >
      {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
    </button>
  );
}
