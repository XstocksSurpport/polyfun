export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "84532");

export const EXPLORER_URL =
  CHAIN_ID === 8453 ? "https://basescan.org" : "https://sepolia.basescan.org";

export const rpcUrl =
  process.env.NEXT_PUBLIC_RPC_URL ??
  (CHAIN_ID === 8453 ? "https://mainnet.base.org" : "https://sepolia.base.org");

export const contracts = {
  launcher: process.env.NEXT_PUBLIC_LAUNCHER_ADDRESS as `0x${string}` | undefined,
  registry: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}` | undefined,
  polyfun: process.env.NEXT_PUBLIC_POLYFUN_ADDRESS as `0x${string}` | undefined,
  launcherDeployBlock: BigInt(process.env.NEXT_PUBLIC_LAUNCHER_DEPLOY_BLOCK ?? "0"),
};

export const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

/** Set in .env.local when ready — empty = placeholder (no navigation). */
export const socialLinks = {
  x: process.env.NEXT_PUBLIC_X_URL ?? "",
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
