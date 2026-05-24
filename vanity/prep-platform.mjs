import { writeFileSync, readFileSync, existsSync } from "node:fs";
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

const exclude = [];
const deploymentPath = join(root, "deployments", "base-mainnet.json");
if (existsSync(deploymentPath)) {
  const d = JSON.parse(readFileSync(deploymentPath, "utf8"));
  for (const key of ["genesisToken", "polyfun", "platformToken", "platformTokenLegacy"]) {
    if (d[key]) exclude.push(d[key]);
  }
}

const metadata = {
  name: "Polyfun",
  symbol: "poly",
  proposition: "Will Polyfun migrate to Uniswap (YES ≥ 90% + 4 ETH) before expiry?",
  description: "Official platform token prediction market on Polyfun.",
};
const metadataHash = keccak256(toBytes(JSON.stringify(metadata)));
const account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);
const { tokenImplementation } = await readLauncherImpls(launcher, 8453);
const r = grindSalt(launcher, account.address, tokenImplementation, { exclude });

writeFileSync(
  join(root, "deployments", "platform-metadata.json"),
  JSON.stringify({ metadataHash, ...metadata }, null, 2) + "\n"
);

console.log(JSON.stringify({ salt: r.salt, predicted: r.predictedAddress, metadataHash }));
