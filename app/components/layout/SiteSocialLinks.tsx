import { SITE_URL, socialLinks } from "@/lib/config";
import { cn } from "@/lib/utils";

function IconX({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M13.9 10.5 21.4 2h-2.1l-6.5 7.4L7.4 2H1l7.9 11.5L1 22h2.1l6.9-7.9L16.6 22H23l-9.1-11.5Zm-1.6 1.8L11.4 12 4.6 3.6h3.3l5.5 7.9 1.9 2.7 6.7 9.6h-3.3l-5.5-7.9Z" />
    </svg>
  );
}

interface SiteSocialLinksProps {
  className?: string;
  variant?: "header" | "inline" | "footer";
}

export function SiteSocialLinks({ className, variant = "inline" }: SiteSocialLinksProps) {
  const xUrl = socialLinks.x.trim();
  const siteHost = SITE_URL.replace(/^https?:\/\//, "");

  if (variant === "header") {
    if (!xUrl) return null;
    return (
      <a
        href={xUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-zinc-950 hover:bg-white/50",
          className
        )}
        aria-label="Polyfun on X"
      >
        <IconX className="h-4 w-4" />
        <span className="hidden tabular-nums sm:inline">@polyfun_wtf</span>
      </a>
    );
  }

  if (variant === "footer") {
    return (
      <p className={cn("flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-zinc-500", className)}>
        <a
          href={SITE_URL}
          className="font-medium text-zinc-950 underline underline-offset-4"
          target="_blank"
          rel="noopener noreferrer"
        >
          {siteHost}
        </a>
        {xUrl ? (
          <a
            href={xUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-zinc-950 underline underline-offset-4"
          >
            @polyfun_wtf
          </a>
        ) : null}
      </p>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-500", className)}>
      <a
        href={SITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-zinc-700 underline-offset-4 hover:text-zinc-950 hover:underline"
      >
        {siteHost}
      </a>
      {xUrl ? (
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-zinc-700 underline-offset-4 hover:text-zinc-950 hover:underline"
        >
          @polyfun_wtf
        </a>
      ) : null}
    </div>
  );
}
