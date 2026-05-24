import { cn } from "@/lib/utils";

interface PlatformVerifiedBadgeProps {
  className?: string;
  compact?: boolean;
}

export function PlatformVerifiedBadge({ className, compact = false }: PlatformVerifiedBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 font-semibold uppercase tracking-wide text-emerald-700",
        compact ? "text-[9px]" : "text-[10px]",
        className
      )}
    >
      <svg
        viewBox="0 0 16 16"
        className={cn("shrink-0 fill-current", compact ? "h-2.5 w-2.5" : "h-3 w-3")}
        aria-hidden
      >
        <path d="M6.5 10.2 4.3 8l-.9.9 3.1 3.1 6.5-6.5-.9-.9z" />
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 1.5a5.5 5.5 0 1 1 0 11A5.5 5.5 0 0 1 8 2.5Z" />
      </svg>
      Official
    </span>
  );
}
