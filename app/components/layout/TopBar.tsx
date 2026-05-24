"use client";

import { ConnectButton } from "./ConnectButton";
import { IconBell, IconSearch } from "./icons";

interface TopBarProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function TopBar({ title, subtitle, action }: TopBarProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-zinc-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#111111] sm:text-[28px]">{title}</h1>
        {subtitle ? <p className="mt-1 text-meta">{subtitle}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {action}
        <div className="relative hidden sm:block">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="search"
            placeholder="Search markets…"
            className="h-9 w-52 rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm text-[#111111] outline-none placeholder:text-[#6B7280] focus:border-zinc-300 lg:w-64"
          />
        </div>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-[#6B7280] hover:text-[#111111]"
          aria-label="Notifications"
        >
          <IconBell />
        </button>
        <ConnectButton />
      </div>
    </header>
  );
}
