import { githubUrl } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="shrink-0 border-t border-zinc-200 py-3">
      <p className="text-center text-xs text-zinc-500 sm:text-sm">
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
        .{" "}
        {githubUrl ? (
          <>
            The source code is available on{" "}
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
