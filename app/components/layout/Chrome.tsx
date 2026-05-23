"use client";

import { usePathname } from "next/navigation";
import { ConnectButton } from "./ConnectButton";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Markets" },
  { href: "/launch", label: "Launch" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/docs", label: "Docs" },
] as const;

export function Chrome() {
  return (
    <header className="glass-header sticky top-0 z-50 w-full supports-[backdrop-filter]:bg-white/45">
      <div className="mx-auto grid h-[4.25rem] max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-6 sm:h-16">
        <div className="flex items-center justify-self-start">
          <Logo href="/" variant="header" />
        </div>

        <nav className="flex items-center justify-center gap-0.5 sm:gap-1" aria-label="Main">
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>

        <div className="flex items-center justify-self-end">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active =
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200",
        active
          ? "bg-white/75 text-zinc-900 shadow-sm backdrop-blur-sm"
          : "text-zinc-500 hover:bg-white/50 hover:text-zinc-900"
      )}
    >
      {label}
    </a>
  );
}
