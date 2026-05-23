import { CHAIN_ID } from "./config";
import type { MigrationAdapter } from "./types";

export const BASE_BLOCK_TIME_SEC = 2;

export const launchProtection = {
  guardBlocks: 60,
  maxBuyBps: 50,
} as const;

export const dexAddresses = {
  mainnet: {
    uniswapV3Factory: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD" as const,
    uniswapNFPM: "0x03A520B32C04BF3bEEf7BEb72E919cf822Ed34f1" as const,
    aerodromeRouter: "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874e43" as const,
    aerodromeVoter: "0x16613524e02ad97eDfeF371bC883F744f419e5BB" as const,
    slipstreamPoolFactory: "0x5e7BB104d84c7CB9B682AaC2F3d509f5F406809A" as const,
    slipstreamNFPM: "0x827922686190790b37229fd06084350E74485b72" as const,
  },
  sepolia: {
    uniswapV3Factory: "0x4752ba5dbc23f44d87812a447b708fcc1114d091" as const,
    uniswapNFPM: "0x27F971cb582BF9E50F397eAD4Be2C3ca774bee7D" as const,
    aerodromeRouter: "0x0000000000000000000000000000000000000000" as const,
    aerodromeVoter: "0x0000000000000000000000000000000000000000" as const,
    slipstreamPoolFactory: "0x0000000000000000000000000000000000000000" as const,
    slipstreamNFPM: "0x0000000000000000000000000000000000000000" as const,
  },
} as const;

export function getDexAddresses() {
  return CHAIN_ID === 8453 ? dexAddresses.mainnet : dexAddresses.sepolia;
}

export function mapMigrationAdapter(code: number): MigrationAdapter {
  switch (code) {
    case 1:
      return "aerodrome_cl";
    default:
      return "uniswap_v3";
  }
}

export function migrationAdapterLabel(adapter: MigrationAdapter): string {
  return adapter === "aerodrome_cl" ? "Aerodrome" : "Uniswap V3";
}

export function dexscreenerPoolUrl(pool: string): string {
  const chain = CHAIN_ID === 8453 ? "base" : "basesepolia";
  return `https://dexscreener.com/${chain}/${pool}`;
}

export function isLaunchGuardActive(
  launchBlock: number | undefined,
  currentBlock: number | undefined
): boolean {
  if (!launchBlock || !currentBlock) return false;
  return currentBlock <= launchBlock + launchProtection.guardBlocks;
}
