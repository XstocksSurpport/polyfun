#!/usr/bin/env node
/**
 * Deploy Polyfun to Base Sepolia and sync addresses to app/.env.local
 *
 * Requires:
 *   contracts/.env  →  PRIVATE_KEY, BASE_SEPOLIA_RPC_URL, BASESCAN_API_KEY (optional)
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contractsDir = join(root, "contracts");
const deploymentPath = join(root, "deployments", "base-sepolia.json");
const envLocalPath = join(root, "app", ".env.local");

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

const contractEnv = loadEnvFile(join(contractsDir, ".env"));
const rpc = process.env.BASE_SEPOLIA_RPC_URL ?? contractEnv.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org";
const privateKey = process.env.PRIVATE_KEY ?? contractEnv.PRIVATE_KEY;

if (!privateKey) {
  console.error("Missing PRIVATE_KEY. Copy contracts/.env.example → contracts/.env and set your deployer key.");
  process.exit(1);
}

console.log("Deploying to Base Sepolia…");
const verifyArgs = contractEnv.BASESCAN_API_KEY
  ? ["--verify", "--etherscan-api-key", contractEnv.BASESCAN_API_KEY]
  : [];

const result = spawnSync(
  "forge",
  [
    "script",
    "script/Deploy.s.sol:DeployPolyfun",
    "--rpc-url",
    rpc,
    "--broadcast",
    ...verifyArgs,
  ],
  {
    cwd: contractsDir,
    stdio: "inherit",
    env: { ...process.env, ...contractEnv, BASE_SEPOLIA_RPC_URL: rpc },
  }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

if (!existsSync(deploymentPath)) {
  console.error("Deployment JSON not found:", deploymentPath);
  process.exit(1);
}

const deployment = JSON.parse(readFileSync(deploymentPath, "utf8"));
console.log("\nDeployed:");
console.log(JSON.stringify(deployment, null, 2));

const existing = loadEnvFile(envLocalPath);
const merged = {
  ...existing,
  NEXT_PUBLIC_CHAIN_ID: "84532",
  NEXT_PUBLIC_RPC_URL: rpc,
  NEXT_PUBLIC_LAUNCHER_ADDRESS: deployment.launcher,
  NEXT_PUBLIC_REGISTRY_ADDRESS: deployment.registry,
  NEXT_PUBLIC_LAUNCHER_DEPLOY_BLOCK: String(deployment.deployBlock),
  VANITY_SERVICE_URL: existing.VANITY_SERVICE_URL ?? "http://localhost:8787",
};

const envContent =
  Object.entries(merged)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n";

writeFileSync(envLocalPath, envContent);
console.log("\nUpdated app/.env.local");
console.log("Next: npm run vanity:install && npm run vanity (in another terminal), then npm run dev");
