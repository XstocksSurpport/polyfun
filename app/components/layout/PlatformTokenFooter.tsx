"use client";

import { useState } from "react";
import { contracts, EXPLORER_URL } from "@/lib/config";

export function PlatformTokenFooter() {
  const [copied, setCopied] = useState(false);

  if (!contracts.polyfun) return null;

  const address = contracts.polyfun;

  async function copyAddress() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-neutral-400">
      <span className="font-medium text-neutral-500">$POLY</span>
      <span className="font-mono text-neutral-500">
        {address.slice(0, 6)}…
        <span className="font-bold text-neutral-900">ba5e</span>
      </span>
      <button type="button" onClick={copyAddress} className="hover:text-neutral-900">
        {copied ? "Copied" : "Copy"}
      </button>
      <a
        href={`${EXPLORER_URL}/token/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-neutral-900"
      >
        Basescan ↗
      </a>
    </div>
  );
}
