"use client";

import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { IconDocs, IconHome, IconLaunch, IconMarkets, IconPortfolio } from "./icons";
import { isNavActive, MAIN_NAV } from "./nav";

const NAV_ICONS = {
  "/": IconHome,
  "/markets": IconMarkets,
  "/portfolio": IconPortfolio,
  "/launch": IconLaunch,
  "/docs": IconDocs,
} as const;

export function Sidebar() {
  return (
    <aside className="hidden w-[220px] shrink-0 flex-col border-r border-zinc-200 bg-white px-4 py-6 lg:flex">
      <Logo href="/" variant="sidebar" className="mb-10 px-2" />
      <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
        {MAIN_NAV.map((item) => (
          <SidebarLink key={item.href} {...item} Icon={NAV_ICONS[item.href]} />
        ))}
      </nav>
      <p className="px-2 text-meta">Base mainnet · YES/NO</p>
    </aside>
  );
}

function SidebarLink({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: typeof IconHome;
}) {
  const pathname = usePathname();
  const active = isNavActive(pathname, href);

  return (
    <a
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-zinc-100 text-[#111111]"
          : "text-[#6B7280] hover:bg-zinc-50 hover:text-[#111111]"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {label}
    </a>
  );
}
