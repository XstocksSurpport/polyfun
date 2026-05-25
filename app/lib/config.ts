export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "84532");

export const SITE_SLOGAN = "The Prediction-Driven Launchpad";

export const SITE_NAME = "Polyfun";

/** Canonical production URL — used for OG tags and share links. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://polyfun.wtf").replace(/\/$/, "");

export const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL ?? "";

export const EXPLORER_URL =
  CHAIN_ID === 8453 ? "https://basescan.org" : "https://sepolia.basescan.org";

export const rpcUrl =
  process.env.NEXT_PUBLIC_RPC_URL ??
  (CHAIN_ID === 8453 ? "https://mainnet.base.org" : "https://sepolia.base.org");

/** Prefer server-only key for API/indexer routes (not bundled to the client). */
export const serverRpcUrl = process.env.RPC_URL ?? rpcUrl;

export const contracts = {
  launcher:
    (process.env.NEXT_PUBLIC_LAUNCHER_ADDRESS as `0x${string}` | undefined) ??
    (CHAIN_ID === 8453 ? ("0xC5fc704de106aFa8E93D4B051966F83b4C1f197e" as const) : undefined),
  registry:
    (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}` | undefined) ??
    (CHAIN_ID === 8453 ? ("0x2579c1840671781F4AC353bc3aCf96a3dDB66C69" as const) : undefined),
  polyfun: process.env.NEXT_PUBLIC_POLYFUN_ADDRESS as `0x${string}` | undefined,
  genesisMarket: process.env.NEXT_PUBLIC_GENESIS_MARKET_ADDRESS as `0x${string}` | undefined,
  platformMarket:
    (process.env.NEXT_PUBLIC_PLATFORM_MARKET_ADDRESS as `0x${string}` | undefined) ??
    (CHAIN_ID === 8453 ? ("0x9f026ACD5784A4f975e3EFAf75F90cAbE29CB75e" as const) : undefined),
  platformToken:
    (process.env.NEXT_PUBLIC_PLATFORM_TOKEN_ADDRESS as `0x${string}` | undefined) ??
    (CHAIN_ID === 8453 ? ("0xfC9C959a045225B7bA8882a0Be26901a82F2bA5e" as const) : undefined),
  launcherDeployBlock: BigInt(
    process.env.NEXT_PUBLIC_LAUNCHER_DEPLOY_BLOCK ??
      (CHAIN_ID === 8453 ? "46441647" : "0")
  ),
};

export const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

/** Official social profiles — empty env falls back to production defaults. */
export const socialLinks = {
  x: process.env.NEXT_PUBLIC_X_URL ?? "https://x.com/polyfun_wtf",
  telegram: process.env.NEXT_PUBLIC_TELEGRAM_URL ?? "",
};

export const chainParams = {
  chainId: `0x${CHAIN_ID.toString(16)}`,
  chainName: CHAIN_ID === 8453 ? "Base" : "Base Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: [rpcUrl],
  blockExplorerUrls: [EXPLORER_URL],
};

export function isConfigured() {
  return Boolean(contracts.launcher && contracts.registry);
}

export function getConfigError(): string | null {
  if (!contracts.launcher) return "LAUNCHER_ADDRESS_MISSING";
  if (!contracts.registry) return "REGISTRY_ADDRESS_MISSING";
  return null;
}
