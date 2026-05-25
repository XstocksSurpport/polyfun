import { githubUrl, socialLinks } from "@/lib/config";
import { SiteXLink } from "./SiteSocialLinks";

export function SiteFooter() {
  const xUrl = socialLinks.x.trim();

  return (
    <footer className="shrink-0 border-t border-zinc-200 py-3">
      <p className="flex flex-wrap items-center justify-center gap-2 text-center text-xs text-zinc-500 sm:text-sm">
        <span>
          Built by{" "}
          <a href="/" className="font-medium text-zinc-950 underline underline-offset-4">
            Polyfun
          </a>{" "}
          on{" "}
          <a
            href="https://base.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-zinc-950 underline underline-offset-4"
          >
            Base
          </a>
          .
        </span>
        {xUrl ? <SiteXLink href={xUrl} size="sm" /> : null}
        {githubUrl ? (
          <span>
            Source on{" "}
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-950 underline underline-offset-4"
            >
              GitHub
            </a>
            .
          </span>
        ) : (
          <span>
            Read the{" "}
            <a href="/docs" className="font-medium text-zinc-950 underline underline-offset-4">
              docs
            </a>
            .
          </span>
        )}
      </p>
    </footer>
  );
}
