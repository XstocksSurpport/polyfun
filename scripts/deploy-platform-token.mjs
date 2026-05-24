#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contractsDir = join(root, "contracts");
const vanityDir = join(root, "vanity");
const TREASURY = "0xFDC18444eca2FEfd44fA7516Ff994aAfC17C4fD5";
const EXISTING_FACTORY = process.env.CREATE2_FACTORY ?? "0xE832E090E85a9A1ae84bb549D50c846FD6284cDC";

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

let factory = EXISTING_FACTORY;
if (!process.env.CREATE2_FACTORY) {
  console.log("Using existing Create2 factory:", factory);
} else {
  console.log("Deploying Create2 factory…");
  const factoryDeploy = spawnSync(
    "forge",
    ["create", "PolyfunCreate2Factory", "--rpc-url", rpc, "--private-key", privateKey, "--broadcast"],
    { cwd: contractsDir, encoding: "utf8" }
  );
  const match = (factoryDeploy.stdout + factoryDeploy.stderr).match(/Deployed to:\s*(0x[a-fA-F0-9]{40})/);
  if (!match) process.exit(1);
  factory = match[1];
}

console.log("Grinding ba5e salt…");
const grind = spawnSync("node", ["grind-platform-parallel.mjs", factory], {
  cwd: vanityDir,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
});

if (grind.status !== 0) {
  console.error(grind.stdout);
  process.exit(1);
}

const ground = JSON.parse(grind.stdout.trim());
console.log(`Found in ${ground.attempts} attempts → ${ground.predictedAddress}`);

const deployEnv = {
  ...process.env,
  ...env,
  POLYFUN_SALT: ground.salt,
  CREATE2_FACTORY: factory,
};

const script = spawnSync(
  "forge",
  [
    "script",
    "script/DeployPlatformToken.s.sol:DeployPlatformToken",
    "--rpc-url",
    rpc,
    "--broadcast",
    "--slow",
    "--private-key",
    privateKey,
  ],
  { cwd: contractsDir, stdio: "inherit", env: deployEnv }
);

if (script.status !== 0) process.exit(script.status ?? 1);

const platformPath = join(root, "deployments", "polyfun-platform-base-mainnet.json");
const platform = JSON.parse(readFileSync(platformPath, "utf8"));

const mainnetPath = join(root, "deployments", "base-mainnet.json");
const mainnet = existsSync(mainnetPath) ? JSON.parse(readFileSync(mainnetPath, "utf8")) : {};

writeFileSync(
  mainnetPath,
  JSON.stringify(
    {
      chainId: 8453,
      ...mainnet,
      ...platform,
    },
    null,
    2
  ) + "\n"
);

const envLocalPath = join(root, "app", ".env.local");
const envLocal = loadEnv(envLocalPath);
writeFileSync(
  envLocalPath,
  Object.entries({
    ...envLocal,
    NEXT_PUBLIC_POLYFUN_ADDRESS: platform.polyfun,
    ...(mainnet.launcher ? { NEXT_PUBLIC_LAUNCHER_ADDRESS: mainnet.launcher } : {}),
    ...(mainnet.registry ? { NEXT_PUBLIC_REGISTRY_ADDRESS: mainnet.registry } : {}),
    ...(mainnet.deployBlock ? { NEXT_PUBLIC_LAUNCHER_DEPLOY_BLOCK: String(mainnet.deployBlock) } : {}),
  })
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n"
);

console.log("\nPOLYFUN deployed:", platform.polyfun);
console.log("Treasury:", TREASURY);
