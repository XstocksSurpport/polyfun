import { githubUrl, SITE_URL } from "@/lib/config";
import { SiteSocialLinks } from "./SiteSocialLinks";

export function SiteFooter() {
  return (
    <footer className="shrink-0 space-y-2 border-t border-zinc-200 py-4">
      <SiteSocialLinks variant="footer" />
      <p className="text-center text-xs text-zinc-500 sm:text-sm">
        Built by{" "}
        <a
          href={SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-zinc-950 underline underline-offset-4"
        >
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
        .{" "}
        {githubUrl ? (
          <>
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
          </>
        ) : (
          <>
            Read the{" "}
            <a href="/docs" className="font-medium text-zinc-950 underline underline-offset-4">
              docs
            </a>
            .
          </>
        )}
      </p>
    </footer>
  );
}
