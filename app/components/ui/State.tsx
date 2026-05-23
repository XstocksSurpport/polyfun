export function LoadingBlock() {
  return <div className="py-16 text-center text-sm text-neutral-300">...</div>;
}

export function EmptyBlock() {
  return (
    <div className="rounded-xl border border-dashed border-neutral-200 py-16 text-center text-sm text-neutral-400">
      No markets yet.
    </div>
  );
}

export function SetupBlock() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-6 py-10 text-center">
      <p className="text-base font-medium text-neutral-900">Contracts not deployed yet</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-neutral-500">
        Markets and launch need launcher addresses in <code className="text-xs">app/.env.local</code>.
        You can still connect your wallet with the button in the top-right corner.
      </p>
      <a
        href="/docs"
        className="mt-5 inline-flex min-h-10 items-center rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
      >
        Setup guide
      </a>
    </div>
  );
}

export function ErrorBlock({ code }: { code: string }) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50/50 py-8 text-center text-sm text-red-700">
      {code}
    </div>
  );
}
