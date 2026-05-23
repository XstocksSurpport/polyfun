import { LogoMark } from "@/components/brand/LogoMark";
import { socialLinks } from "@/lib/config";

export function Footer() {
  return (
    <footer className="glass-header mt-auto border-t border-zinc-200/40 supports-[backdrop-filter]:bg-white/35">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-12 text-center">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
        >
          <LogoMark size={24} />
          <span>
            <span className="text-zinc-900">Poly</span>
            <span className="text-cyan-500">fun</span>
          </span>
        </a>
        <nav className="flex items-center gap-4 text-xs text-zinc-400" aria-label="Social">
          <SocialLink label="X" href={socialLinks.x} />
          <span aria-hidden className="text-zinc-300">
            ·
          </span>
          <SocialLink label="TG" href={socialLinks.telegram} />
        </nav>
      </div>
    </footer>
  );
}

function SocialLink({ label, href }: { label: string; href: string }) {
  if (!href) {
    return (
      <span className="cursor-default text-zinc-300" title="Link coming soon">
        {label}
      </span>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-700">
      {label}
    </a>
  );
}
