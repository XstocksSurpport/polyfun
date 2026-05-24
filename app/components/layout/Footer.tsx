import { LogoMark } from "@/components/brand/LogoMark";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#E4E4E7] bg-white">
      <div className="mx-auto flex max-w-6xl justify-center px-4 py-5 sm:px-6">
        <a href="/" className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600 transition-none hover:text-zinc-900">
          <LogoMark size={18} />
          <span>Polyfun</span>
        </a>
      </div>
    </footer>
  );
}
