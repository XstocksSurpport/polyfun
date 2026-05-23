"use client";

import { ConnectButton } from "./ConnectButton";
import { Logo } from "@/components/brand/Logo";

const NAV = [
  { href: "/", label: "Markets" },
  { href: "/launch", label: "Launch" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/docs", label: "Docs" },
] as const;

export function Chrome() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          <Logo href="/" size="sm" />
          <div className="shrink-0">
            <ConnectButton />
          </div>
        </div>
        <nav
          className="-mx-1 flex gap-2 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Main"
        >
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-200 active:bg-neutral-300"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
