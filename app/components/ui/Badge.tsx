import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "yes" | "no" | "pppp" | "outline";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        {
          "bg-neutral-100 text-neutral-600": variant === "default",
          "bg-yes-muted text-yes": variant === "yes",
          "bg-no-muted text-no": variant === "no",
          "bg-neutral-900 text-white font-mono tracking-wide": variant === "pppp",
          "border border-neutral-200 text-neutral-500": variant === "outline",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
