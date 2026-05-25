import { SITE_URL, socialLinks } from "@/lib/config";

export function DocsOfficialLinks() {
  return (
    <section className="page-container mb-8">
      <h2 className="text-lg font-bold tracking-tight text-zinc-950">Official</h2>
      <p className="mt-1.5 text-sm text-zinc-500">Polyfun protocol links on Base mainnet.</p>
      <ul className="mt-3 flex flex-wrap gap-3 text-sm">
        <li>
          <a
            href={SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-zinc-950 underline underline-offset-4"
          >
            polyfun.wtf
          </a>
        </li>
        {socialLinks.x ? (
          <li>
            <a
              href={socialLinks.x}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-950 underline underline-offset-4"
            >
              @polyfun_wtf on X
            </a>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
