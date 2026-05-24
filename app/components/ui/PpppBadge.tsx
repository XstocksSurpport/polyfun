import { displayAddress } from "@/lib/utils";
import { Badge } from "./Badge";

interface PpppBadgeProps {
  address: string;
  showFull?: boolean;
  className?: string;
}

export function PpppBadge({ address, showFull = false, className }: PpppBadgeProps) {
  const { prefix, suffix } = displayAddress(address);

  if (!suffix) {
    return (
      <span className={`font-mono text-xs text-zinc-500 ${className ?? ""}`}>
        {prefix}
      </span>
    );
  }

  if (showFull) {
    return (
      <span className={`font-mono text-xs text-zinc-500 ${className ?? ""}`}>
        {prefix}
        <span className="font-semibold text-[#b8ff3c]">{suffix}</span>
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${className ?? ""}`}>
      <span className="font-mono text-xs text-zinc-500">{prefix.slice(0, 10)}...</span>
      <Badge variant="ba5e">ba5e</Badge>
    </div>
  );
}

export const Ba5eBadge = PpppBadge;
