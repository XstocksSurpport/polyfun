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
const launcher = appEnv.NEXT_PUBLIC_LAUNCHER_ADDRESS;

if (!privateKey || !launcher) {
  console.error("Need PRIVATE_KEY and NEXT_PUBLIC_LAUNCHER_ADDRESS");
  process.exit(1);
}

const deploymentPath = join(root, "deployments", "base-mainnet.json");
if (existsSync(deploymentPath)) {
  const d = JSON.parse(readFileSync(deploymentPath, "utf8"));
  if (d.platformMarket) {
    console.log("Platform market exists:", d.platformMarket);
    process.exit(0);
  }
}

const prep = spawnSync("node", ["prep-platform.mjs"], {
  cwd: join(root, "vanity"),
  encoding: "utf8",
  env: { ...process.env, PRIVATE_KEY: privateKey, LAUNCHER: launcher },
});

if (prep.status !== 0) {
  console.error(prep.stderr || prep.stdout);
  process.exit(1);
}

const { salt, predicted, metadataHash } = JSON.parse(prep.stdout.trim());
console.log("Predicted token:", predicted);

spawnSync("forge", ["build"], { cwd: join(root, "contracts"), stdio: "inherit" });

const script = spawnSync(
  "forge",
  [
    "script",
    "script/BootstrapPlatform.s.sol:BootstrapPlatform",
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
      LAUNCHER_ADDRESS: launcher,
      PLATFORM_SALT: salt,
      PLATFORM_METADATA_HASH: metadataHash,
    },
  }
);

if (script.status !== 0) process.exit(script.status ?? 1);

const boot = JSON.parse(readFileSync(join(root, "deployments", "platform-bootstrap.json"), "utf8"));
const deployment = existsSync(deploymentPath) ? JSON.parse(readFileSync(deploymentPath, "utf8")) : { chainId: 8453 };
Object.assign(deployment, boot);
writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2) + "\n");

const envLocal = loadEnv(join(root, "app", ".env.local"));
writeFileSync(
  join(root, "app", ".env.local"),
  Object.entries({ ...envLocal, NEXT_PUBLIC_PLATFORM_MARKET_ADDRESS: boot.platformMarket, NEXT_PUBLIC_PLATFORM_TOKEN_ADDRESS: boot.platformToken })
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n"
);

console.log("Platform market:", boot.platformMarket);
console.log("Platform token:", boot.platformToken);
console.log("Trade:", `http://localhost:3000/markets?market=${boot.platformMarket}&side=yes`);
