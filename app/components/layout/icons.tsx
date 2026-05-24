import { cn } from "@/lib/utils";

export function IconHome({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMarkets({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function IconLaunch({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export function IconPortfolio({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8z" />
      <path d="M8 8V6a4 4 0 0 1 8 0v2" strokeLinecap="round" />
    </svg>
  );
}

export function IconDocs({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M8 4h8l4 4v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      <path d="M16 4v4h4M9 12h6M9 16h6" strokeLinecap="round" />
    </svg>
  );
}

export function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" strokeLinecap="round" />
    </svg>
  );
}

export function IconBell({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M15 17H9l-1-4.5A5.5 5.5 0 0 1 17 8.5" strokeLinecap="round" />
      <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  );
}
