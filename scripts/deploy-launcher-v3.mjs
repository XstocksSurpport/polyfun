#!/usr/bin/env node
/**
 * Deploy fixed PolyfunMarket implementation + new Registry/Launcher, then bootstrap platform market.
 * Requires contracts/.env with PRIVATE_KEY and BASE_RPC_URL.
 */
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
  console.error("Need PRIVATE_KEY in contracts/.env");
  process.exit(1);
}

const deploymentPath = join(root, "deployments", "base-mainnet.json");
const deployment = existsSync(deploymentPath)
  ? JSON.parse(readFileSync(deploymentPath, "utf8"))
  : { chainId: 8453 };

const tokenImpl = deployment.tokenImplementation;
const adapter = deployment.migrationAdapter;
if (!tokenImpl || !adapter) {
  console.error("Missing tokenImplementation or migrationAdapter in base-mainnet.json");
  process.exit(1);
}

spawnSync("forge", ["build"], { cwd: join(root, "contracts"), stdio: "inherit" });

const script = spawnSync(
  "forge",
  [
    "script",
    "script/DeployLauncherV3.s.sol:DeployLauncherV3",
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
      MIGRATION_ADAPTER: adapter,
    },
  }
);

if (script.status !== 0) process.exit(script.status ?? 1);

const boot = JSON.parse(readFileSync(join(root, "deployments", "launcher-v3-bootstrap.json"), "utf8"));
Object.assign(deployment, {
  previousMarketImplementation: deployment.marketImplementation,
  previousLauncher: deployment.launcher,
  previousRegistry: deployment.registry,
  previousPlatformMarket: deployment.platformMarket,
  previousPlatformToken: deployment.platformToken,
  marketImplementation: boot.marketImplementation,
  registry: boot.registry,
  launcher: boot.launcher,
  launcherV3DeployBlock: boot.launcherDeployBlock,
});
writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2) + "\n");

const envLocal = loadEnv(join(root, "app", ".env.local"));
writeFileSync(
  join(root, "app", ".env.local"),
  Object.entries({
    ...envLocal,
    NEXT_PUBLIC_LAUNCHER_ADDRESS: boot.launcher,
    NEXT_PUBLIC_REGISTRY_ADDRESS: boot.registry,
  })
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n"
);

console.log("Launcher V3:", boot.launcher);
console.log("Market impl:", boot.marketImplementation);
console.log("\nRun: FORCE_PLATFORM=1 node scripts/bootstrap-platform-market.mjs");
