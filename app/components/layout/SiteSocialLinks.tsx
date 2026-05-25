import { socialLinks } from "@/lib/config";
import { cn } from "@/lib/utils";

export function IconX({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M13.9 10.5 21.4 2h-2.1l-6.5 7.4L7.4 2H1l7.9 11.5L1 22h2.1l6.9-7.9L16.6 22H23l-9.1-11.5Zm-1.6 1.8L11.4 12 4.6 3.6h3.3l5.5 7.9 1.9 2.7 6.7 9.6h-3.3l-5.5-7.9Z" />
    </svg>
  );
}

const sizes = {
  sm: "h-7 w-7",
  md: "h-8 w-8",
} as const;

export function SiteXLink({
  href,
  className,
  size = "md",
}: {
  href: string;
  className?: string;
  size?: keyof typeof sizes;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Polyfun on X"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950",
        sizes[size],
        className
      )}
    >
      <IconX className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </a>
  );
}

interface SiteSocialLinksProps {
  className?: string;
}

/** Header X icon — icon only, no handle text. */
export function SiteSocialLinks({ className }: SiteSocialLinksProps) {
  const xUrl = socialLinks.x.trim();
  if (!xUrl) return null;

  return <SiteXLink href={xUrl} className={className} size="md" />;
}
