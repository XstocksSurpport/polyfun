import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { keccak256, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { grindSalt, readLauncherImpls } from "./lib/grind.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pk = process.env.PRIVATE_KEY;
const launcher = process.env.LAUNCHER;

if (!pk || !launcher) {
  console.error("PRIVATE_KEY and LAUNCHER required");
  process.exit(1);
}

const metadata = {
  name: "Polyfun Genesis",
  symbol: "PFUN",
  proposition: "Will Polyfun Genesis migrate to Uniswap (YES ≥ 90% + 4 ETH) before expiry?",
  description: "Official first prediction market on Polyfun.",
};
const metadataHash = keccak256(toBytes(JSON.stringify(metadata)));
const account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);
const { tokenImplementation } = await readLauncherImpls(launcher, 8453);
const r = grindSalt(launcher, account.address, tokenImplementation);

writeFileSync(
  join(root, "deployments", "genesis-metadata.json"),
  JSON.stringify({ metadataHash, ...metadata }, null, 2) + "\n"
);

console.log(JSON.stringify({ salt: r.salt, predicted: r.predictedAddress, metadataHash }));
