import { MIGRATION } from "@/lib/protocol";
import { formatEth } from "@/lib/utils";

export function HowItWorksPanel() {
  return (
    <aside className="rounded-xl border border-neutral-200 bg-white space-y-4 p-5">
      <div>
        <p className="text-eyebrow text-zinc-400">How it works</p>
        <h2 className="mt-1 text-base font-semibold text-zinc-900">YES / NO internal market</h2>
      </div>

      <ol className="space-y-3 text-sm leading-relaxed text-zinc-600">
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-900">
            1
          </span>
          <span>
            After launch, trading opens on the{" "}
            <strong className="text-zinc-800">internal market</strong> — buy YES (bullish) or NO
            (bearish) with ETH.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-900">
            2
          </span>
          <span>
            YES share ≥ 90% and YES net inflow ≥ {formatEth(MIGRATION.yesTargetWei, 0)} →{" "}
            <strong className="text-neutral-900">Uniswap migration</strong>; YES holders redeem
            tokens.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-600">
            3
          </span>
          <span>
            If the countdown ends below threshold →{" "}
            <strong className="text-neutral-600">NO wins</strong>; YES funds are distributed to NO
            holders pro rata.
          </span>
        </li>
      </ol>

      <a
        href="/launch"
        className="block rounded-xl bg-zinc-950 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-zinc-800"
      >
        Launch the first market
      </a>
    </aside>
  );
}
