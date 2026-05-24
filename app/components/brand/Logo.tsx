import { cn } from "@/lib/utils";
import { SITE_SLOGAN } from "@/lib/config";
import { LogoMark } from "./LogoMark";

interface LogoProps {
  className?: string;
  href?: string;
  showWordmark?: boolean;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "header" | "sidebar";
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
    variant === "sidebar" || variant === "header" ? (
      <span className={cn("inline-flex items-center gap-2.5 leading-none", className)}>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#b8ff3c] text-sm font-bold text-black">
          P
        </span>
        {showWordmark && (
          <span className="text-lg font-bold tracking-tight text-white">
            Poly<span className="text-[#b8ff3c]">fun</span>
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
        <LogoMark size={s.mark} className="transition-transform duration-200 group-hover:scale-[1.03]" />
        {showWordmark && (
          <span className={cn("flex leading-none", showTagline ? "flex-col items-start" : "items-center")}>
            <span className={cn(s.word, "font-semibold tracking-tight text-white")}>
              Poly<span className="text-[#b8ff3c]">fun</span>
            </span>
            {showTagline && (
              <span className={cn(s.tag, "mt-1 font-medium tracking-tight text-zinc-500 normal-case")}>
                {SITE_SLOGAN}
              </span>
            )}
          </span>
        )}
      </span>
    );

  if (href) {
    return (
      <a href={href} className="inline-flex items-center rounded-ui outline-none focus-visible:ring-2 focus-visible:ring-[#b8ff3c]/50">
        {content}
      </a>
    );
  }

  return content;
}
