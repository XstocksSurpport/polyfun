export const MAIN_NAV = [
  { href: "/", label: "Home" },
  { href: "/markets", label: "Markets" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/launch", label: "Launch" },
  { href: "/docs", label: "Docs" },
] as const;

/** Match current route to nav item (supports legacy /market/* → Markets). */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/markets") {
    return (
      pathname === "/markets" ||
      pathname.startsWith("/markets/") ||
      pathname.startsWith("/market/")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
