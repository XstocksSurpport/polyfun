function PanelIcon() {
  return (
    <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/80 bg-white/50 shadow-inner backdrop-blur-sm">
      <svg
        className="h-5 w-5 text-zinc-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
        />
      </svg>
    </div>
  );
}

const panelClass =
  "glass-panel mx-auto flex max-w-lg flex-col items-center justify-center px-10 py-20 text-center sm:px-14 sm:py-24";

export function LoadingBlock() {
  return (
    <div className={panelClass}>
      <PanelIcon />
      <span className="animate-pulse-soft text-sm text-zinc-400">Loading?</span>
    </div>
  );
}

export function EmptyBlock() {
  return (
    <div className={panelClass}>
      <PanelIcon />
      <h3 className="mb-3 text-lg font-bold tracking-tight text-zinc-900">No markets yet</h3>
      <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
        Launches will show up here once contracts are live on chain.
      </p>
    </div>
  );
}

export function SetupBlock() {
  return (
    <div className={panelClass}>
      <PanelIcon />
      <h3 className="mb-3 text-lg font-bold tracking-tight text-zinc-900">
        Contracts not deployed yet
      </h3>
      <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
        Markets and launch need launcher addresses in
        <code className="mx-1 rounded-md border border-zinc-200/60 bg-white/60 px-1.5 py-0.5 font-mono text-xs text-zinc-700 shadow-inner backdrop-blur-sm">
          app/.env.local
        </code>
        . You can still connect your wallet from the header.
      </p>
      <a
        href="/docs"
        className="mt-10 rounded-xl bg-zinc-900/5 px-6 py-2.5 text-sm font-semibold text-zinc-800 backdrop-blur-sm transition-all hover:bg-zinc-900/10"
      >
        Setup guide
      </a>
    </div>
  );
}

export function ErrorBlock({ code }: { code: string }) {
  return (
    <div className="glass-panel mx-auto max-w-lg px-10 py-20 text-center text-sm text-red-600 sm:py-24">
      {code}
    </div>
  );
}
