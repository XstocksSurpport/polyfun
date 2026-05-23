"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/utils";

interface CountdownProps {
  expiryTs: number;
  compact?: boolean;
}

export function Countdown({ expiryTs, compact = false }: CountdownProps) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, expiryTs - Math.floor(Date.now() / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiryTs]);

  const expired = remaining === 0;

  if (compact) {
    return (
      <span className="font-mono text-sm tabular-nums text-neutral-900">
        {expired ? "--" : formatCountdown(remaining)}
      </span>
    );
  }

  return (
    <p className="font-mono text-lg tabular-nums text-neutral-900">
      {expired ? "--:--:--" : formatCountdown(remaining)}
    </p>
  );
}
