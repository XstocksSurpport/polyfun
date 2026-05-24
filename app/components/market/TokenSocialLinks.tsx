import type { Market } from "@/lib/types";

export function TokenSocialLinks({ market, className = "" }: { market: Market; className?: string }) {
  const links = [
    { label: "X", href: market.twitter },
    { label: "TG", href: market.telegram },
    { label: "Web", href: market.website },
  ].filter((l) => l.href?.trim());

  if (links.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href!.startsWith("http") ? link.href! : `https://${link.href}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-950"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
