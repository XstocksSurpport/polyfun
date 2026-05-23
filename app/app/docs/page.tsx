import { BASE_BLOCK_TIME_SEC, getDexAddresses, launchProtection } from "@/lib/dex";
import { EXTERNAL_OPTION } from "@/lib/external-option";
import { FEES, FEE_RECEIVER, MIGRATION, TOKEN_SUPPLY } from "@/lib/protocol";
import { formatEth } from "@/lib/utils";

export default function DocsPage() {
  const dex = getDexAddresses();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Docs</h1>

      <dl className="mt-8 space-y-6 text-sm text-neutral-600">
        <div>
          <dt className="font-medium text-neutral-900">Chain</dt>
          <dd className="mt-1">Base · {BASE_BLOCK_TIME_SEC}s block · EIP-4844 gas</dd>
        </div>

        <div>
          <dt className="font-medium text-neutral-900">Supply</dt>
          <dd className="mt-1">1B · Internal {TOKEN_SUPPLY.internalBps / 100}% · LP {TOKEN_SUPPLY.externalLpBps / 100}%</dd>
        </div>

        <div>
          <dt className="font-medium text-neutral-900">Migration</dt>
          <dd className="mt-1">YES {MIGRATION.thresholdBps / 100}% + {formatEth(MIGRATION.yesTargetWei, 0)} ETH</dd>
          <dd>Pool ~{formatEth(MIGRATION.totalPoolAtTriggerWei, 2)} ETH at trigger</dd>
          <dd>Expiry &lt; 90% → NO</dd>
          <dd>Token suffix: pppp</dd>
        </div>

        <div>
          <dt className="font-medium text-neutral-900">Fees</dt>
          <dd className="mt-1">Deploy {formatEth(FEES.deployWei)} · Trade {FEES.tradingBps / 100}% · Migrate {formatEth(FEES.migrationWei)}</dd>
          <dd className="font-mono text-xs text-neutral-400">{FEE_RECEIVER}</dd>
        </div>

        <div>
          <dt className="font-medium text-neutral-900">External DEX</dt>
          <dd className="mt-1">Uniswap V3 CL · LP burn · default MVP</dd>
          <dd>Aerodrome Slipstream · Gauge stake · AERO buyback burn</dd>
          <dd className="mt-2 font-mono text-xs text-neutral-400">
            V3 {dex.uniswapV3Factory.slice(0, 10)}...
          </dd>
          <dd className="font-mono text-xs text-neutral-400">
            Slipstream {dex.slipstreamPoolFactory.slice(0, 10)}...
          </dd>
        </div>

        <div>
          <dt className="font-medium text-neutral-900">Launch guard</dt>
          <dd className="mt-1">{launchProtection.guardBlocks} blocks · EOA only</dd>
          <dd>Max buy: {launchProtection.maxBuyBps / 100}% supply / tx</dd>
        </div>

        <div>
          <dt className="font-medium text-neutral-900">Atomic bundle</dt>
          <dd className="mt-1 font-mono text-xs leading-relaxed">
            buyYes → settle → migrate → token unlock
          </dd>
        </div>

        <div>
          <dt className="font-medium text-neutral-900">Option</dt>
          <dd className="mt-1">{EXTERNAL_OPTION.windowDays}d · 2x MCap · BREAK / FAIL</dd>
          <dd>BREAK win → {EXTERNAL_OPTION.winnerFeeShareBps / 100}% swap fees</dd>
          <dd>FAIL win → buyback burn</dd>
        </div>

        <div>
          <dt className="font-medium text-neutral-900">Farcaster Frame</dt>
          <dd className="mt-1 font-mono text-xs">GET /api/frame?market=0x...</dd>
        </div>
      </dl>
    </div>
  );
}
