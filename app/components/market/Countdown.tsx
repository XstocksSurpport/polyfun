"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CountdownProps {
  expiryTs: number;
  compact?: boolean;
  label?: string;
  timeClassName?: string;
  labelClassName?: string;
}

export function Countdown({
  expiryTs,
  compact = false,
  label,
  timeClassName,
  labelClassName,
}: CountdownProps) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, expiryTs - Math.floor(Date.now() / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiryTs]);

  const expired = remaining === 0;
  const time = expired ? "—" : formatCountdown(remaining);

  if (compact) {
    if (label) {
      return (
        <span className="inline-flex items-baseline gap-1.5">
          <span className={cn("tabular-nums", timeClassName ?? "text-stat")}>{time}</span>
          <span className={cn("text-meta", labelClassName)}>{label}</span>
        </span>
      );
    }
    return <span className={cn("tabular-nums", timeClassName ?? "text-stat")}>{time}</span>;
  }

  return <p className={cn("tabular-nums", timeClassName ?? "text-stat")}>{time}</p>;
}
