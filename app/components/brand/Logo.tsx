import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogoMark } from "./LogoMark";

interface LogoProps {
  className?: string;
  href?: string;
  showWordmark?: boolean;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
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
}: LogoProps) {
  const s = sizes[size];

  const content = (
    <span
      className={cn(
        "group inline-flex items-center gap-2.5 transition-opacity hover:opacity-90",
        className
      )}
    >
      <span className="relative">
        <LogoMark size={s.mark} className="transition-transform duration-200 group-hover:scale-[1.03]" />
      </span>
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className={cn(s.word, "font-semibold tracking-tight")}>
            <span className="text-neutral-900">Poly</span>
            <span className="bg-gradient-to-r from-emerald-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent">
              fun
            </span>
          </span>
          {showTagline && (
            <span className={cn(s.tag, "mt-1 font-medium tracking-wide text-neutral-400 uppercase")}>
              Predict · Launch · Base
            </span>
          )}
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
