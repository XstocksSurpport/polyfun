#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(path) {
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

const env = loadEnv(join(root, "contracts", ".env"));
const appEnv = loadEnv(join(root, "app", ".env.local"));
const rpc = env.BASE_RPC_URL ?? appEnv.NEXT_PUBLIC_RPC_URL ?? "https://mainnet.base.org";
const privateKey = env.PRIVATE_KEY;

if (!privateKey) {
  console.error("Missing PRIVATE_KEY in contracts/.env");
  process.exit(1);
}

const deploymentPath = join(root, "deployments", "base-mainnet.json");
const deployment = existsSync(deploymentPath) ? JSON.parse(readFileSync(deploymentPath, "utf8")) : {};

const tokenImpl = deployment.tokenImplementation;
const marketImpl = deployment.marketImplementation;
const adapter = deployment.migrationAdapter;

if (!tokenImpl || !marketImpl || !adapter) {
  console.error("Missing implementation addresses in deployments/base-mainnet.json");
  process.exit(1);
}

spawnSync("forge", ["build"], { cwd: join(root, "contracts"), stdio: "inherit" });

const script = spawnSync(
  "forge",
  [
    "script",
    "script/DeployLauncherV2.s.sol:DeployLauncherV2",
    "--rpc-url",
    rpc,
    "--broadcast",
    "--slow",
    "--private-key",
    privateKey,
  ],
  {
    cwd: join(root, "contracts"),
    stdio: "inherit",
    env: {
      ...process.env,
      ...env,
      TOKEN_IMPLEMENTATION: tokenImpl,
      MARKET_IMPLEMENTATION: marketImpl,
      MIGRATION_ADAPTER: adapter,
    },
  }
);

if (script.status !== 0) process.exit(script.status ?? 1);

const boot = JSON.parse(readFileSync(join(root, "deployments", "launcher-v2-bootstrap.json"), "utf8"));

const next = {
  ...deployment,
  previousRegistry: deployment.registry,
  previousLauncher: deployment.launcher,
  previousLauncherDeployBlock: deployment.deployBlock,
  platformMarketLegacy: deployment.platformMarket,
  platformTokenLegacy: deployment.platformToken,
  platformDeployBlockLegacy: deployment.platformDeployBlock,
  registry: boot.registry,
  launcher: boot.launcher,
  deployBlock: boot.launcherDeployBlock,
  launcherV2DeployBlock: boot.launcherDeployBlock,
};
delete next.platformMarket;
delete next.platformToken;
delete next.platformDeployBlock;

writeFileSync(deploymentPath, JSON.stringify(next, null, 2) + "\n");

const envLocal = loadEnv(join(root, "app", ".env.local"));
const envOut = {
  ...envLocal,
  NEXT_PUBLIC_LAUNCHER_ADDRESS: boot.launcher,
  NEXT_PUBLIC_REGISTRY_ADDRESS: boot.registry,
  NEXT_PUBLIC_LAUNCHER_DEPLOY_BLOCK: String(boot.launcherDeployBlock),
};
delete envOut.NEXT_PUBLIC_GENESIS_MARKET_ADDRESS;
delete envOut.NEXT_PUBLIC_PLATFORM_MARKET_ADDRESS;

writeFileSync(
  join(root, "app", ".env.local"),
  Object.entries(envOut)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n"
);

console.log("\nLauncher V2 (48h) deployed:", boot.launcher);
console.log("Registry V2:", boot.registry);
console.log("Deploy block:", boot.launcherDeployBlock);
console.log("\nRun: npm run bootstrap:platform  (to create new official $poly market on V2)");
