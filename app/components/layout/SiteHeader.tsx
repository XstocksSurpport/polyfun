"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { githubUrl } from "@/lib/config";
import { ConnectButton } from "./ConnectButton";
import { isNavActive, MAIN_NAV } from "./nav";

function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function IconGithub({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.27.825-.585 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.36-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.705.825.585A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(true);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const skipPathClose = useRef(true);
  const navigating = useRef(false);

  useEffect(() => {
    if (skipPathClose.current) {
      skipPathClose.current = false;
      return;
    }
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const navigate = useCallback(
    (href: string) => {
      if (navigating.current) return;
      navigating.current = true;
      closeMenu();
      router.push(href);
      window.setTimeout(() => {
        navigating.current = false;
      }, 400);
    },
    [closeMenu, router]
  );

  return (
    <>
      <header className="glass-header fixed top-0 right-0 left-0 z-50 h-14">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-2 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-white/50"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
          >
            <IconMenu className="h-4 w-4" />
            Menu
          </button>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {githubUrl ? (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-zinc-950 hover:bg-white/50 sm:inline-flex"
              >
                <IconGithub className="h-4 w-4" />
                <span className="tabular-nums">GitHub</span>
              </a>
            ) : (
              <span className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-zinc-500 sm:inline-flex">
                <IconGithub className="h-4 w-4" />
                <span className="tabular-nums">GitHub</span>
              </span>
            )}

            <ConnectButton />
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <nav
            id="site-menu"
            className="glass-header animate-menu-down pointer-events-auto absolute top-14 right-0 left-0 z-20 border-b border-white/45 shadow-[0_12px_40px_rgba(15,23,42,0.08)]"
            aria-label="Main"
          >
            <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
              <ul className="flex flex-wrap items-center gap-1">
                {MAIN_NAV.map((item) => {
                  const active = isNavActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <button
                        type="button"
                        onClick={() => navigate(item.href)}
                        className={cn(
                          "block min-h-11 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-white/55 text-zinc-950"
                            : "text-zinc-600 hover:bg-white/45 hover:text-zinc-950"
                        )}
                      >
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={closeMenu}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-white/50 hover:text-zinc-950"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </nav>
          <button
            type="button"
            className="pointer-events-auto absolute inset-0 top-28 z-0 bg-zinc-900/20 backdrop-blur-[4px]"
            aria-label="Close menu"
            onClick={closeMenu}
          />
        </div>
      ) : null}
    </>
  );
}
