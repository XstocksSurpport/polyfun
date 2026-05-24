import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "yes" | "no" | "ba5e" | "pppp" | "outline";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium",
        {
          "bg-zinc-100 text-zinc-600": variant === "default",
          "bg-green-50 text-[#16a34a]": variant === "yes",
          "bg-red-50 text-[#dc2626]": variant === "no",
          "bg-zinc-900 text-zinc-50": variant === "ba5e" || variant === "pppp",
          "border border-zinc-200 text-zinc-600": variant === "outline",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
