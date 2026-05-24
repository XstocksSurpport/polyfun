#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contractsDir = join(root, "contracts");

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

const env = loadEnv(join(contractsDir, ".env"));
const rpc = env.BASE_RPC_URL ?? "https://mainnet.base.org";
const privateKey = env.PRIVATE_KEY;

if (!privateKey) {
  console.error("Missing PRIVATE_KEY in contracts/.env");
  process.exit(1);
}

spawnSync("forge", ["build"], { cwd: contractsDir, stdio: "inherit" });

const script = spawnSync(
  "forge",
  [
    "script",
    "script/Deploy.s.sol:DeployPolyfun",
    "--rpc-url",
    rpc,
    "--broadcast",
    "--slow",
    "--private-key",
    privateKey,
  ],
  { cwd: contractsDir, stdio: "inherit", env: { ...process.env, ...env } }
);

if (script.status !== 0) process.exit(script.status ?? 1);

const deploymentPath = join(root, "deployments", "base-mainnet.json");
const previous = existsSync(deploymentPath) ? JSON.parse(readFileSync(deploymentPath, "utf8")) : {};
const deployment = {
  ...previous,
  ...JSON.parse(readFileSync(deploymentPath, "utf8")),
};
writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2) + "\n");

const envLocalPath = join(root, "app", ".env.local");
const envLocal = loadEnv(envLocalPath);
writeFileSync(
  envLocalPath,
  Object.entries({
    ...envLocal,
    NEXT_PUBLIC_CHAIN_ID: "8453",
    NEXT_PUBLIC_RPC_URL: rpc,
    NEXT_PUBLIC_LAUNCHER_ADDRESS: deployment.launcher,
    NEXT_PUBLIC_REGISTRY_ADDRESS: deployment.registry,
    NEXT_PUBLIC_LAUNCHER_DEPLOY_BLOCK: String(deployment.deployBlock),
  })
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n"
);

console.log("\nDeployed launcher:", deployment.launcher);
console.log("Registry:", deployment.registry);
console.log("Deploy block:", deployment.deployBlock);
console.log("Updated app/.env.local");
