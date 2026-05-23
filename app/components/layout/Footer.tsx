import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer className="border-t border-neutral-100 bg-neutral-50/50">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <Logo href="/" size="sm" showTagline />
        <div className="flex items-center gap-4 text-xs text-neutral-400">
          <Link href="/docs" className="transition-colors hover:text-neutral-700">
            Docs
          </Link>
          <span className="font-mono tracking-wide text-neutral-300">pppp</span>
        </div>
      </div>
    </footer>
  );
}
