import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CalloutProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Callout({ title, children, className }: CalloutProps) {
  return (
    <aside
      className={cn(
        "rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-600",
        className
      )}
    >
      {title ? (
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">{title}</p>
      ) : null}
      {children}
    </aside>
  );
}

export function Param({ children }: { children: ReactNode }) {
  return <span className="font-medium tabular-nums text-zinc-950">{children}</span>;
}
