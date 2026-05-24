import type { Hash } from "viem";

export type Address = `0x${string}`;

/** Mirrors PolyfunMarket.MarketStatus: Active=0, Migrated=1, SettledNo=2 */
export type MarketStatus = "active" | "migrated" | "failed";

export type MigrationAdapter = "uniswap_v3" | "aerodrome_cl";

export interface TokenMetadata {
  name: string;
  symbol: string;
  description?: string;
  proposition?: string;
  image?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
}

export interface Market {
  address: Address;
  token: Address;
  symbol: string;
  name: string;
  proposition: string;
  creator: Address;
  yesRatioBps: number;
  thresholdBps: number;
  yesValueWei: bigint;
  noValueWei: bigint;
  expiryTs: number;
  status: MarketStatus;
  isOfficial: boolean;
  metadataHash?: Hash;
  imageUrl?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  externalPool?: Address;
  migrationAdapter?: MigrationAdapter;
  launchBlock?: number;
  createdAt?: number;
}

export interface Trade {
  id: string;
  txHash: Hash;
  side: "yes" | "no";
  amountWei: bigint;
  shares: bigint;
  buyer: Address;
  blockNumber: bigint;
  timestamp: number;
}

export interface LaunchQuote {
  creationFeeWei: bigint;
  polyfunBurnAmount: bigint;
  polyfunDiscountBps: number;
}

export interface VanitySaltResult {
  salt: Hash;
  predictedAddress: Address;
  expiresAt: string;
}

export interface PortfolioPosition {
  market: Market;
  yesShares: bigint;
  noShares: bigint;
}
