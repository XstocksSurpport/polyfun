import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";
import { CHAIN_ID, rpcUrl } from "@/lib/config";

// Singleton avoids viem PublicClient generic mismatch across chain definitions.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPublicClient(): any {
  client ??= createPublicClient({
    chain: CHAIN_ID === 8453 ? base : baseSepolia,
    transport: http(rpcUrl, { timeout: 12_000 }),
  });
  return client;
}
