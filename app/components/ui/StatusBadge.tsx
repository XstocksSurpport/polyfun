import { cn } from "@/lib/utils";
import type { MarketStatus } from "@/lib/types";

const statusConfig: Record<
  MarketStatus,
  { label: string; variant: "yes" | "no" | "neutral" }
> = {
  active: { label: "Live", variant: "yes" },
  migrated: { label: "Migrated", variant: "neutral" },
  failed: { label: "Settled", variant: "no" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: MarketStatus;
  className?: string;
}) {
  const { label, variant } = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-none",
        variant === "yes" && "bg-green-50 text-[#16a34a]",
        variant === "no" && "bg-red-50 text-[#dc2626]",
        variant === "neutral" && "bg-zinc-100 text-[#6B7280]",
        className
      )}
    >
      {label}
    </span>
  );
}

export function SideBadge({
  side,
  className,
}: {
  side: "yes" | "no";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-none",
        side === "yes" ? "bg-green-50 text-[#16a34a]" : "bg-red-50 text-[#dc2626]",
        className
      )}
    >
      {side === "yes" ? "Yes" : "No"}
    </span>
  );
}
