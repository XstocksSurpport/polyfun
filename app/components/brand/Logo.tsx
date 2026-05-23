import { cn } from "@/lib/utils";
import { LogoMark } from "./LogoMark";

interface LogoProps {
  className?: string;
  href?: string;
  showWordmark?: boolean;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "header";
}

const sizes = {
  sm: { mark: 28, word: "text-base", tag: "text-[10px]" },
  md: { mark: 32, word: "text-lg", tag: "text-[11px]" },
  lg: { mark: 40, word: "text-xl", tag: "text-xs" },
} as const;

export function Logo({
  className,
  href = "/",
  showWordmark = true,
  showTagline = false,
  size = "md",
  variant = "default",
}: LogoProps) {
  const s = sizes[size];

  const content =
    variant === "header" ? (
      <span className={cn("inline-flex items-center gap-2 leading-none", className)}>
        <LogoMark size={28} className="shrink-0" />
        {showWordmark && (
          <span className="whitespace-nowrap text-lg font-bold tracking-tight">
            <span className="bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
              Poly
            </span>
            <span className="text-cyan-500">fun</span>
          </span>
        )}
      </span>
    ) : (
      <span
        className={cn(
          "group inline-flex items-center gap-2.5 transition-opacity hover:opacity-90",
          className
        )}
      >
        <span className="relative flex items-center">
          <LogoMark
            size={s.mark}
            className="transition-transform duration-200 group-hover:scale-[1.03]"
          />
        </span>
        {showWordmark && (
          <span className={cn("flex leading-none", showTagline ? "flex-col items-start" : "items-center")}>
            <span className={cn(s.word, "font-semibold tracking-tight")}>
              <span className="text-neutral-900">Poly</span>
              <span className="bg-gradient-to-r from-emerald-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent">
                fun
              </span>
            </span>
            {showTagline && (
              <span
                className={cn(s.tag, "mt-1 font-medium uppercase tracking-wide text-neutral-400")}
              >
                Predict · Launch · Base
              </span>
            )}
          </span>
        )}
      </span>
    );

  if (href) {
    return (
      <a
        href={href}
        className="inline-flex items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
      >
        {content}
      </a>
    );
  }

  return content;
}
