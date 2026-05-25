import { contracts } from "./config";
import { FEE_RECEIVER, MARKET_DURATION_HOURS } from "./protocol";
import { EXPLORER_URL } from "./config";

/** Shared implementation / infrastructure addresses (unchanged across launcher upgrades). */
const SHARED = {
  chainId: 8453,
  tokenImplementation: "0x17Dc6109404c1058026b0C8a056Ef0f764F3Aabe" as const,
  marketImplementation: "0xe896d5c95BdC5afC5c16390CeB4402F8777fb793" as const,
  migrationAdapter: "0xb5CB3E255246932Cc79B97e54267fcddfbc575a9" as const,
  polyfunCreate2Factory: "0xE832E090E85a9A1ae84bb549D50c846FD6284cDC" as const,
  weth: "0x4200000000000000000000000000000000000006" as const,
  v3Factory: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD" as const,
  v3Nfpm: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1" as const,
  dead: "0x000000000000000000000000000000000000dEaD" as const,
} as const;

export const DEPLOYMENTS = {
  ...SHARED,
  launcher: contracts.launcher ?? "",
  registry: contracts.registry ?? "",
  platformMarket: contracts.platformMarket ?? "",
  platformToken: contracts.platformToken ?? "",
  polyfunTreasury: FEE_RECEIVER,
  marketDurationHours: MARKET_DURATION_HOURS,
} as const;

export type DeploymentEntry = {
  label: string;
  address: string;
  note?: string;
};

function row(label: string, address: string | undefined, note?: string): DeploymentEntry | null {
  if (!address) return null;
  return { label, address, note };
}

export function getContractAddressRows(): DeploymentEntry[] {
  return [
    row("Launcher", contracts.launcher, "createLaunch entrypoint"),
    row("Registry", contracts.registry, "Official market registry"),
    row("Migration Adapter", SHARED.migrationAdapter),
    row("Token Implementation", SHARED.tokenImplementation),
    row("Market Implementation", SHARED.marketImplementation, "Launcher V3 clone template (reentrancy fix)"),
    row("Platform Token ($poly)", contracts.platformToken, "Official platform token · …ba5e suffix"),
    row("Platform Market ($poly)", contracts.platformMarket, "Official platform prediction market"),
    row("Create2 Factory", SHARED.polyfunCreate2Factory),
    row("WETH (Base)", SHARED.weth),
    row("Uniswap V3 Factory", SHARED.v3Factory),
    row("Uniswap V3 NFPM", SHARED.v3Nfpm),
    row("LP Burn Address", SHARED.dead, "Migration LP destination"),
  ].filter((r): r is DeploymentEntry => r !== null);
}

export function explorerAddressUrl(address: string) {
  return `${EXPLORER_URL}/address/${address}`;
}
