import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
  size?: number;
}

export function LogoMark({ className, size = 32 }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <rect width="32" height="32" rx="9" fill="url(#pf-bg)" />
      <rect
        x="0.75"
        y="0.75"
        width="30.5"
        height="30.5"
        rx="8.25"
        stroke="url(#pf-border)"
        strokeWidth="1.5"
      />
      <path
        d="M11 9.5h6.2c2.65 0 4.3 1.45 4.3 3.55 0 1.55-.85 2.75-2.25 3.25l3.15 5.2H18.8l-2.85-4.75H14v4.75h-3V9.5Zm3 6h3c1.05 0 1.65-.55 1.65-1.45 0-.95-.6-1.5-1.65-1.5H14v2.95Z"
        fill="white"
      />
      <path
        d="M8 23.5a8 8 0 0 1 16 0"
        stroke="url(#pf-arc)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="24.5" cy="24.5" r="1.75" fill="#34D399" />
      <defs>
        <linearGradient id="pf-bg" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F172A" />
          <stop offset="1" stopColor="#1E293B" />
        </linearGradient>
        <linearGradient id="pf-border" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34D399" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#60A5FA" stopOpacity="0.35" />
          <stop offset="1" stopColor="#F87171" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="pf-arc" x1="8" y1="24" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34D399" />
          <stop offset="1" stopColor="#60A5FA" />
        </linearGradient>
      </defs>
    </svg>
  );
}
