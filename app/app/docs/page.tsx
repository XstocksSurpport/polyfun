import type { ReactNode } from "react";
import { CHAIN_ID } from "@/lib/config";
import { launchProtection } from "@/lib/dex";
import { FEES, FEE_RECEIVER, MIGRATION, TOKEN_SUPPLY, formatSupplyMillions } from "@/lib/protocol";
import { formatEth } from "@/lib/utils";

export const metadata = {
  title: "Documentation",
};

const deployFee = formatEth(FEES.deployWei);
const migrateFee = formatEth(FEES.migrationWei);
const yesTarget = formatEth(MIGRATION.yesTargetWei, 0);
const poolAtTrigger = formatEth(MIGRATION.totalPoolAtTriggerWei, 2);
const chainName = CHAIN_ID === 8453 ? "Base" : "Base Sepolia";
const chainId = CHAIN_ID;

const sections = [
  { id: "protocol", label: "Protocol" },
  { id: "deploy", label: "Deploy" },
  { id: "market", label: "Market" },
  { id: "migrate", label: "Migration" },
  { id: "settle", label: "Settlement" },
  { id: "fees", label: "Fees" },
  { id: "supply", label: "Supply" },
  { id: "guards", label: "Guards" },
] as const;

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="border-b border-neutral-200 pb-8">
        <h1 className="font-mono text-sm font-medium uppercase tracking-widest text-neutral-400">
          polyfun / docs
        </h1>
        <p className="mt-4 text-lg leading-snug text-neutral-900">
          Launcher + YES/NO internal market on {chainName} (chain {chainId}). Migration
          path is Uniswap V3; LP NFTs go to burn.
        </p>
      </header>

      <nav
        className="-mx-4 mt-6 flex flex-wrap gap-2 border-b border-neutral-100 px-4 pb-4 sm:mx-0 sm:px-0"
        aria-label="Sections"
      >
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-md border border-neutral-200 px-2.5 py-1 font-mono text-xs text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
          >
            {s.label}
          </a>
        ))}
      </nav>

      <article className="mt-10 space-y-14 font-[family-name:var(--font-sans)]">
        <Section id="protocol" title="Protocol">
          <p className="text-neutral-700 leading-relaxed">
            One deployment = <code className="text-sm">PolyfunToken</code> +{" "}
            <code className="text-sm">PolyfunMarket</code>. Trading stays inside the market
            contract until either migration fires or the round settles on NO.
          </p>
          <ul className="mt-4 list-none space-y-2 border-l-2 border-neutral-200 pl-4 font-mono text-sm text-neutral-800">
            <li>
              <span className="text-neutral-400">internal</span> — YES/NO buys, pool
              accounting, countdown
            </li>
            <li>
              <span className="text-neutral-400">migrate</span> — YES side hits threshold +
              floor; Uniswap pool created in same tx as triggering buy
            </li>
            <li>
              <span className="text-neutral-400">settle</span> — timer expired, threshold not
              met; NO pro-rata ETH, YES worthless
            </li>
          </ul>
          <p className="mt-4 text-sm text-neutral-500">
            Migration gate: YES ≥ {MIGRATION.thresholdBps / 100}% of (YES+NO) pool{" "}
            <em>and</em> YES ETH ≥ {yesTarget}. Reference pool at gate ≈ {poolAtTrigger}{" "}
            total ({yesTarget} YES / remainder NO).
          </p>
        </Section>

        <Section id="deploy" title="Deploy">
          <ul className="space-y-3 text-neutral-700">
            <Li>
              Wallet on {chainName}. Gas + deploy fee ({deployFee}) in native ETH.
            </Li>
            <Li>
              <a href="/launch" className="underline decoration-neutral-300 hover:decoration-neutral-600">
                /launch
              </a>{" "}
              — POST metadata, request CREATE2 salt (vanity worker), call{" "}
              <code className="text-sm">createLaunch</code>.
            </Li>
            <Li>
              Token address must end <code className="text-sm">0x…70707070</code> (
              <code className="text-sm">pppp</code>). Launcher rejects anything else.
            </Li>
            <Li>
              Indexer picks up the market after deploy block; UI polls{" "}
              <code className="text-sm">/api/markets</code>.
            </Li>
          </ul>
        </Section>

        <Section id="market" title="Internal market">
          <p className="text-neutral-700">
            <code className="text-sm">buyYes</code> / <code className="text-sm">buyNo</code>{" "}
            with ETH. {FEES.tradingBps / 100}% fee skimmed to{" "}
            <code className="text-sm">FEE_RECEIVER</code> before side credit.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <Def term="YES">
              Long migration. Triggering buy can call migrate if bps + YES floor satisfied.
              Post-migrate: claim internal allocation (800M slice), pro-rata to YES deposits.
            </Def>
            <Def term="NO">
              Short migration. On settle: share of contract ETH balance by NO deposit weight.
              YES ETH not refunded.
            </Def>
          </dl>
        </Section>

        <Section id="migrate" title="Migration (YES wins)">
          <ul className="list-disc space-y-2 pl-5 text-neutral-700">
            <li>Internal buys disabled.</li>
            <li>
              {migrateFee} deducted from pool before LP mint ({FEES.migrationBpsAlt / 100}%
              alt path exists in constants — on-chain uses fixed wei).
            </li>
            <li>
              {formatSupplyMillions(TOKEN_SUPPLY.externalLp)} tokens + residual ETH → Uniswap
              V3; tick range fixed in adapter (not user-selected).
            </li>
            <li>
              {formatSupplyMillions(TOKEN_SUPPLY.internal)} held for YES claims; transfers
              enabled after migrate.
            </li>
            <li>NFPM position → burn address. No rug via LP pull.</li>
          </ul>
        </Section>

        <Section id="settle" title="Settlement (NO wins)">
          <p className="text-neutral-700">
            Callable once expiry passed and migration predicate false. Anyone can submit;
            pays gas only.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-700">
            <li>
              {FEES.settlementBps / 100}% of contract balance → platform (
              <code className="text-sm">settleNoWin</code> fee path).
            </li>
            <li>Remainder split across NO depositors.</li>
            <li>No Uniswap pool. Token never becomes freely transferable via migrate path.</li>
          </ul>
        </Section>

        <Section id="fees" title="Fees">
          <div className="overflow-hidden rounded-lg border border-neutral-200">
            <table className="w-full text-left font-mono text-sm">
              <thead className="bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Kind</th>
                  <th className="px-3 py-2 font-medium">Rate</th>
                  <th className="px-3 py-2 font-medium">Hook</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-800">
                <tr>
                  <td className="px-3 py-2">deploy</td>
                  <td className="px-3 py-2 tabular-nums">{deployFee}</td>
                  <td className="px-3 py-2 text-neutral-600">createLaunch</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">trade</td>
                  <td className="px-3 py-2 tabular-nums">{FEES.tradingBps / 100}%</td>
                  <td className="px-3 py-2 text-neutral-600">buyYes / buyNo</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">migration</td>
                  <td className="px-3 py-2 tabular-nums">{migrateFee}</td>
                  <td className="px-3 py-2 text-neutral-600">migrate (YES win)</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">settlement</td>
                  <td className="px-3 py-2 tabular-nums">{FEES.settlementBps / 100}%</td>
                  <td className="px-3 py-2 text-neutral-600">settleNoWin</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-mono text-xs text-neutral-400 break-all">
            receiver {FEE_RECEIVER}
          </p>
        </Section>

        <Section id="supply" title="Supply">
          <ul className="mt-2 space-y-1 font-mono text-sm text-neutral-800">
            <li>total — 1e9 * 1e18</li>
            <li>internal — {TOKEN_SUPPLY.internalBps / 100}% ({formatSupplyMillions(TOKEN_SUPPLY.internal)})</li>
            <li>external LP — {TOKEN_SUPPLY.externalLpBps / 100}% ({formatSupplyMillions(TOKEN_SUPPLY.externalLp)})</li>
          </ul>
          <p className="mt-4 text-sm text-neutral-500">
            Suffix check is on the low 4 bytes of the token address, not a string in metadata.
          </p>
        </Section>

        <Section id="guards" title="Guards">
          <ul className="space-y-3 text-neutral-700">
            <Li>
              <strong className="text-neutral-900">LP lock.</strong> Post-migrate NFPM NFT
              owner is burn; decreaseLiquidity unavailable to launcher.
            </Li>
            <Li>
              <strong className="text-neutral-900">Launch window.</strong> First{" "}
              {launchProtection.guardBlocks} blocks: EOA-only buys, max transfer{" "}
              {launchProtection.maxBuyBps / 100}% of supply per tx.
            </Li>
            <Li>
              <strong className="text-neutral-900">Entry.</strong> Only launcher-issued{" "}
              <code className="text-sm">pppp</code> tokens. No direct market deploy.
            </Li>
          </ul>
          <p className="mt-6 border-t border-neutral-100 pt-4 text-sm text-neutral-500">
            Not shipped: Aerodrome adapter, BREAK/FAIL external options. Spec lives in{" "}
            <code className="text-sm">docs/DEVELOPMENT.md</code>.
          </p>
        </Section>
      </article>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-10">
      <h2 className="text-base font-semibold tracking-tight text-neutral-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Li({ children }: { children: ReactNode }) {
  return <li className="leading-relaxed">{children}</li>;
}

function Def({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200 px-3 py-3">
      <dt className="font-mono text-xs font-medium uppercase text-neutral-500">{term}</dt>
      <dd className="mt-1.5 text-sm leading-relaxed text-neutral-700">{children}</dd>
    </div>
  );
}
