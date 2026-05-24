import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DocsContractAddresses } from "@/components/docs/DocsContractAddresses";
import { launchProtection } from "@/lib/dex";
import { FEES, FEE_RECEIVER, MARKET_DURATION_HOURS, MIGRATION, TOKEN_SUPPLY, formatSupplyMillions } from "@/lib/protocol";
import { formatEth } from "@/lib/utils";
import { Callout, Param } from "@/components/ui/Callout";

export const metadata = {
  title: "Documentation",
};

const deployFee = formatEth(FEES.deployWei);
const migrateFee = formatEth(FEES.migrationWei);
const yesTarget = formatEth(MIGRATION.yesTargetWei, 0);
const poolAtTrigger = formatEth(MIGRATION.totalPoolAtTriggerWei, 2);

const sections = [
  { id: "lifecycle", label: "Lifecycle" },
  { id: "deploy", label: "Deploy" },
  { id: "market", label: "Market" },
  { id: "terminal", label: "Terminal" },
  { id: "tokenomics", label: "Tokenomics" },
  { id: "security", label: "Security" },
] as const;

export default function DocsPage() {
  return (
    <>
      <PageHeader
        title="Polyfun Protocol"
        description="Technical specification — internal bonding curve launcher and twin-sided YES/NO AMM on Base (Chain ID 8453)."
      />

      <nav
        className="page-container mb-8 flex flex-wrap gap-1.5 border-b border-zinc-200 pb-4"
        aria-label="Sections"
      >
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-md border border-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-950"
          >
            {s.label}
          </a>
        ))}
      </nav>

      <DocsContractAddresses />

      <article className="page-container prose-docs space-y-12 pb-16">
        <section>
          <p>
            Polyfun is an internal bonding curve launcher and twin-sided AMM (YES/NO prediction
            market) natively deployed on <strong>Base</strong> (Chain ID:{" "}
            <Param>8453</Param>). Upon successful migration gating, the protocol provisions
            liquidity to Uniswap V3 and permanently burns the Liquidity Provider (LP) position via
            the Nonfungible Position Manager (NFPM).
          </p>
        </section>

        <Section id="lifecycle" title="1. Core State & Lifecycle">
          <p>
            Every token deployment instantiates a paired architectural coupling:{" "}
            <code>PolyfunToken</code> (ERC20) and <code>PolyfunMarket</code> (Escrow/AMM). Asset
            velocity and price discovery remain encapsulated within the market contract until a
            terminal lifecycle event triggers:
          </p>

          <pre className="mt-4 overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-4 font-mono text-[11px] leading-relaxed text-zinc-700 sm:text-xs">
{`                  ┌─────────────── [ Deploy ] ───────────────┐
                  │                                          │
                  ▼                                          ▼
     ┌────────────────────────┐                 ┌────────────────────────┐
     │  internal (Bonding)    │                 │     settle (Expiry)    │
     │  - Dual-sided AMM      │                 │  - Threshold NOT met   │
     │  - 1% protocol fee     │                 │  - YES = 0 | NO = Claim│
     └────────────────────────┘                 └────────────────────────┘
                  │
                  ▼ (Threshold + Floor Met)
     ┌────────────────────────┐
     │   migrate (Terminal)   │
     │  - Atomic UniV3 LP     │
     │  - NFPM NFT -> Burn    │
     └────────────────────────┘`}
          </pre>

          <dl className="mt-6 space-y-4">
            <Phase term="internal">
              Active trading phase ({MARKET_DURATION_HOURS}-hour countdown from deploy). Executes
              YES/NO asset minting, global pool accounting, and chronological epoch countdown.
            </Phase>
            <Phase term="migrate">
              Terminal optimistic execution path. Triggered atomically when YES side satisfies both
              the saturation threshold and the ETH floor.
            </Phase>
            <Phase term="settle">
              Terminal pessimistic execution path. Triggered post-expiry if the migration gate
              criteria are not met. NO positions claim pro-rata collateral; YES positions are
              hard-coded to zero value.
            </Phase>
          </dl>

          <h3>Migration Gate Predicate</h3>
          <p>
            Migration conditions are evaluated on-chain via the following logic:
          </p>
          <div className="my-4 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm text-zinc-800">
            Gate = (Pool<sub>YES</sub> ≥ 0.90 × (Pool<sub>YES</sub> + Pool<sub>NO</sub>)) ∧ (
            ETH<sub>YES</sub> ≥ <Param>{yesTarget}</Param>)
          </div>
          <p>
            Reference state at exact gate saturation: ≈ <Param>{poolAtTrigger}</Param> cumulative
            gross TVL (<Param>{yesTarget}</Param> assigned to YES / remainder residual NO skew).
          </p>
        </Section>

        <Section id="deploy" title="2. Deployment Topology & Vanity Suffix Gating">
          <p>
            Initiated via Base mainnet. Target gas budget requires native ETH coverage alongside a
            flat execution premium.
          </p>
          <ul>
            <li>
              <strong>Route:</strong>{" "}
              <a href="/launch">/launch</a> — POST payload contains metadata, initializes a
              decentralized vanity worker to compute a CREATE2 salt.
            </li>
            <li>
              <strong>Address Verification:</strong> The protocol enforces an on-chain suffix
              constraint. The low 4 bytes of the deployed token address must resolve to{" "}
              <code>0xba5e</code> (<code>ba5e</code>).
            </li>
            <li>
              <strong>Access Control:</strong> The generated salt is strictly cryptographically
              bound to the <code>msg.sender</code> wallet. The deployment factory rejects foreign or
              front-run salt injection.
            </li>
            <li>
              <strong>Data Availability:</strong> UI states synchronize via polling{" "}
              <code>/api/markets</code> triggered by custom indexer subgraphs tracking factory
              deploy blocks.
            </li>
          </ul>

          <pre className="mt-4 overflow-x-auto rounded-md border border-zinc-200 bg-zinc-950 p-4 font-mono text-[13px] leading-relaxed text-zinc-100">
{`// On-chain validation snippet
require(
  address(deployedToken) & 0xFFFFFFFF == 0x0000ba5e,
  "Err: Invalid Suffix"
);`}
          </pre>
        </Section>

        <Section id="market" title="3. Internal Market Mechanics">
          <p>
            Direct capital routing utilizes <code>buyYes</code> / <code>buyNo</code> entry points
            using raw <code>msg.value</code> (ETH). A hard-coded{" "}
            <Param>{FEES.tradingBps / 100}%</Param> protocol fee is sliced directly to the{" "}
            <code>FEE_RECEIVER</code> prior to calculating pool invariant adjustments and crediting
            user position weights.
          </p>

          <h3>Execution Paths</h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <Def term="YES (Long Migration)">
              The transaction that fulfills the bonding curve criteria executes{" "}
              <code>migrate()</code> atomically inline. Post-migration, YES holders pull their
              proportional share of the {formatSupplyMillions(TOKEN_SUPPLY.internal)} token
              allocation pool relative to their internal deposit weight.
            </Def>
            <Def term="NO (Short Settlement)">
              If expiration is reached, NO holders claim a pro-rata share of the contract&apos;s
              aggregate ETH balance based on relative pool weight. YES positions forfeit all
              deposited capital.
            </Def>
          </dl>
        </Section>

        <Section id="terminal" title="4. Terminal State Resolution">
          <h3>Path A: migrate (YES Victory)</h3>
          <ul>
            <li>
              <strong>State Lock:</strong> Mutates internal AMM functions to disabled states.
            </li>
            <li>
              <strong>Fee Extraction:</strong> Deducts a fixed <Param>{migrateFee}</Param> protocol
              migration fee (immutable wei constant in production bytecode).
            </li>
            <li>
              <strong>Liquidity Provisioning:</strong> Automatically routes{" "}
              {formatSupplyMillions(TOKEN_SUPPLY.externalLp)} tokens paired with all residual pool
              ETH to a fresh Uniswap V3 pool. Tick ranges are hard-coded into the factory adapter
              architecture (zero user-side slippage or range configuration).
            </li>
            <li>
              <strong>Distribution:</strong> Unlocks the {formatSupplyMillions(TOKEN_SUPPLY.internal)}{" "}
              token tranche for internal YES claims; sets <code>transfersEnabled = true</code>.
            </li>
            <li>
              <strong>Anti-Rug Enforcement:</strong> Transposes the Uniswap V3 NFPM ownership
              directly to <code>address(0)</code> (Burn). Liquidity pull vectors via{" "}
              <code>decreaseLiquidity</code> are permanently neutralized.
            </li>
          </ul>

          <h3>Path B: settle (NO Victory)</h3>
          <ul>
            <li>
              <strong>Trigger:</strong> Permissionless execution vector available to any EOA once
              block timestamp surpasses expiration and migration predicates evaluate to false.
              Caller pays gas; no MEV bounties.
            </li>
            <li>
              <strong>Fee Capture:</strong> Deducts a flat{" "}
              <Param>{FEES.settlementBps / 100}%</Param> platform fee (<code>settleNoWin</code>{" "}
              path).
            </li>
            <li>
              <strong>Liquidation:</strong> Disburses the remaining{" "}
              <Param>{100 - FEES.settlementBps / 100}%</Param> of total contract ETH to NO
              depositors. No external AMM pool is initialized.
            </li>
          </ul>
        </Section>

        <Section id="tokenomics" title="5. Tokenomics & Fee Structure">
          <h3>Token Allocation</h3>
          <ul>
            <li>
              <strong>Total Supply Max Cap:</strong>{" "}
              <Param>1 × 10⁹ × 10¹⁸</Param> (1B tokens, 18 decimals)
            </li>
            <li>
              <strong>Internal Distribution (Bonding / Claims):</strong>{" "}
              <Param>{TOKEN_SUPPLY.internalBps / 100}%</Param> (
              {formatSupplyMillions(TOKEN_SUPPLY.internal)})
            </li>
            <li>
              <strong>External Liquidity (Uniswap V3 LP):</strong>{" "}
              <Param>{TOKEN_SUPPLY.externalLpBps / 100}%</Param> (
              {formatSupplyMillions(TOKEN_SUPPLY.externalLp)})
            </li>
          </ul>

          <h3>Protocol Matrix</h3>
          <div className="overflow-hidden rounded-md border border-zinc-200 not-prose">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Operation</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">Rate / Cost</th>
                  <th className="px-4 py-2.5 font-medium">Hook / Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                <tr>
                  <td className="px-4 py-2.5 font-medium text-zinc-950">Deploy</td>
                  <td className="px-4 py-2.5">Flat Fee</td>
                  <td className="px-4 py-2.5 tabular-nums">{deployFee}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-500">createLaunch()</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-medium text-zinc-950">Trade</td>
                  <td className="px-4 py-2.5">Percentage</td>
                  <td className="px-4 py-2.5 tabular-nums">{FEES.tradingBps / 100}%</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-500">
                    buyYes() / buyNo()
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-medium text-zinc-950">Migration</td>
                  <td className="px-4 py-2.5">Fixed Slice</td>
                  <td className="px-4 py-2.5 tabular-nums">{migrateFee}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-500">migrate() (YES Win)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-medium text-zinc-950">Settlement</td>
                  <td className="px-4 py-2.5">Percentage</td>
                  <td className="px-4 py-2.5 tabular-nums">{FEES.settlementBps / 100}%</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-500">
                    settleNoWin() (NO Win)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="security" title="6. Security Guards & System Constraints">
          <ul>
            <li>
              <strong>Deterministic LP Lock:</strong> The NFPM token destination is strictly assigned
              to the burn address inside the migration transaction payload.
            </li>
            <li>
              <strong>Launch Anti-Whale / Anti-Bot Window:</strong> The first{" "}
              <Param>{launchProtection.guardBlocks}</Param> blocks post-deployment enforce strict{" "}
              <code>tx.origin == msg.sender</code> (EOA-only validation). Individual swap volume is
              hard-capped at <Param>{launchProtection.maxBuyBps / 100}%</Param> of total supply per
              transaction.
            </li>
            <li>
              <strong>Factory Isolation:</strong> Only tokens carrying the validated{" "}
              <code>ba5e</code> suffix minted via the verified factory can initialize markets. Direct
              manual injections are rejected at the edge.
            </li>
          </ul>

          <Callout title="Note" className="mt-6">
            Aerodrome V2 adapter matrices and BREAK/FAIL emergency state overrides are omitted from
            the initial production build. For upcoming feature specs, refer to{" "}
            <code>docs/DEVELOPMENT.md</code>.
          </Callout>
        </Section>
      </article>
    </>
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
    <section id={id} className="scroll-mt-20">
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function Phase({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div>
      <dt className="font-display text-sm font-semibold text-zinc-950">{term}</dt>
      <dd className="mt-1 text-zinc-600">{children}</dd>
    </div>
  );
}

function Def({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-zinc-200 px-4 py-3">
      <dt className="font-display text-sm font-semibold text-zinc-950">{term}</dt>
      <dd className="mt-1.5 text-sm leading-relaxed text-zinc-600">{children}</dd>
    </div>
  );
}
