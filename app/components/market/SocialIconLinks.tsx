import { cn } from "@/lib/utils";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
      <path d="M9.52 6.77 15.16 0h-1.34L8.9 5.88 4.78 0H0l5.9 8.56L0 16h1.34l5.2-6.01L10.7 16H15.5L9.52 6.77Zm-1.04 1.2L2.28 1.04h2.2l6.56 9.54-2.56 3.39H4.72L8.48 7.97Z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        d="M14.5 1.5 1.5 7c-.9.4-.88 1.6.04 1.95l3.2 1.12 1.24 3.86c.28.88 1.44 1.08 2.02.36l1.82-2.2 3.56 2.62c.74.54 1.78.14 1.98-.74L15.5 2.8c.22-.98-.72-1.78-1.66-1.3Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="M5.5 9.2 11.8 4.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M2.5 8h11M8 2.5c1.8 1.6 2.8 3.7 2.8 5.5S9.8 11.9 8 13.5M8 2.5C6.2 4.1 5.2 6.2 5.2 8s1 3.9 2.8 5.5"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

const SOCIAL_ITEMS = [
  { key: "x", field: "twitter" as const, label: "X", Icon: XIcon },
  { key: "tg", field: "telegram" as const, label: "Telegram", Icon: TelegramIcon },
  { key: "web", field: "website" as const, label: "Website", Icon: GlobeIcon },
];

interface SocialIconLinksProps {
  twitter?: string;
  telegram?: string;
  website?: string;
  className?: string;
}

function normalizeHref(href: string) {
  return href.startsWith("http") ? href : `https://${href}`;
}

export function SocialIconLinks({ twitter, telegram, website, className }: SocialIconLinksProps) {
  const hrefs: Record<(typeof SOCIAL_ITEMS)[number]["field"], string | undefined> = {
    twitter,
    telegram,
    website,
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {SOCIAL_ITEMS.map(({ key, field, label, Icon }) => {
        const href = hrefs[field]?.trim();
        const baseClass =
          "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded border border-zinc-200 text-zinc-500 transition-colors";

        if (href) {
          return (
            <a
              key={key}
              href={normalizeHref(href)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(baseClass, "hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900")}
              aria-label={label}
            >
              <Icon className="h-3 w-3" />
            </a>
          );
        }

        return (
          <span
            key={key}
            className={cn(baseClass, "cursor-default text-zinc-400")}
            aria-label={label}
            aria-disabled="true"
          >
            <Icon className="h-3 w-3" />
          </span>
        );
      })}
    </div>
  );
}
