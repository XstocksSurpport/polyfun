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
      <span className={`font-mono text-xs text-neutral-400 ${className ?? ""}`}>
        {prefix}
      </span>
    );
  }

  if (showFull) {
    return (
      <span className={`font-mono text-xs text-neutral-500 ${className ?? ""}`}>
        {prefix}
        <span className="text-neutral-900 font-semibold">{suffix}</span>
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${className ?? ""}`}>
      <span className="font-mono text-xs text-neutral-400">{prefix.slice(0, 10)}...</span>
      <Badge variant="pppp">pppp</Badge>
    </div>
  );
}
