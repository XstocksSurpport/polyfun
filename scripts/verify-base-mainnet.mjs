#!/usr/bin/env node
/**
 * Verify Polyfun Base mainnet contracts on Basescan.
 * Usage: BASESCAN_API_KEY=... node scripts/verify-base-mainnet.mjs
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contractsDir = join(root, "contracts");
const apiKey = process.env.BASESCAN_API_KEY;

if (!apiKey) {
  console.error("Set BASESCAN_API_KEY");
  process.exit(1);
}

const WETH = "0x4200000000000000000000000000000000000006";
const V3_FACTORY = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";
const V3_NFPM = "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1";
const REGISTRY = "0x2579c1840671781F4AC353bc3aCf96a3dDB66C69";
const TOKEN_IMPL = "0x17Dc6109404c1058026b0C8a056Ef0f764F3Aabe";
const MARKET_IMPL_V3 = "0xe896d5c95BdC5afC5c16390CeB4402F8777fb793";
const ADAPTER = "0xb5CB3E255246932Cc79B97e54267fcddfbc575a9";
const LAUNCHER = "0xC5fc704de106aFa8E93D4B051966F83b4C1f197e";
const CREATE2_FACTORY = "0xE832E090E85a9A1ae84bb549D50c846FD6284cDC";
const TREASURY = "0xFDC18444eca2FEfd44fA7516Ff994aAfC17C4fD5";
const PLATFORM_MARKET = "0x9f026ACD5784A4f975e3EFAf75F90cAbE29CB75e";
const PLATFORM_TOKEN = "0xfC9C959a045225B7bA8882a0Be26901a82F2bA5e";
const POLYFUN_PLATFORM_TOKEN = "0xEB91caaB933f196C7775d9eA5BDabebe20fBba5e";

function castEncode(signature, ...args) {
  const r = spawnSync("cast", ["abi-encode", signature, ...args], {
    encoding: "utf8",
    shell: true,
  });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout);
  return r.stdout.trim();
}

function verify(address, path, constructorArgs) {
  console.log(`\n=== Verifying ${path} @ ${address} ===`);
  const args = [
    "verify-contract",
    address,
    path,
    "--chain",
    "base",
    "--etherscan-api-key",
    apiKey,
    "--verifier",
    "etherscan",
    "--verifier-url",
    "https://api.etherscan.io/v2/api?chainid=8453",
    "--watch",
  ];
  if (constructorArgs) {
    args.push("--constructor-args", constructorArgs);
  }
  const r = spawnSync("forge", args, {
    cwd: contractsDir,
    stdio: "inherit",
    env: { ...process.env, BASESCAN_API_KEY: apiKey, ETHERSCAN_API_KEY: "" },
    shell: true,
  });
  return r.status === 0;
}

const jobs = [
  ["Registry", REGISTRY, "src/PolyfunRegistry.sol:PolyfunRegistry", null],
  ["Token Implementation", TOKEN_IMPL, "src/PolyfunToken.sol:PolyfunToken", null],
  ["Market Implementation V3", MARKET_IMPL_V3, "src/PolyfunMarket.sol:PolyfunMarket", null],
  [
    "Migration Adapter",
    ADAPTER,
    "src/adapters/UniswapV3Adapter.sol:UniswapV3Adapter",
    castEncode("constructor(address,address,address)", V3_FACTORY, V3_NFPM, WETH),
  ],
  [
    "Launcher V3",
    LAUNCHER,
    "src/PolyfunLauncher.sol:PolyfunLauncher",
    castEncode(
      "constructor(address,address,address,address)",
      REGISTRY,
      TOKEN_IMPL,
      MARKET_IMPL_V3,
      ADAPTER
    ),
  ],
  ["Create2 Factory", CREATE2_FACTORY, "src/PolyfunCreate2Factory.sol:PolyfunCreate2Factory", null],
  [
    "POLYFUN platform token (CREATE2)",
    POLYFUN_PLATFORM_TOKEN,
    "src/PolyfunPlatformToken.sol:PolyfunPlatformToken",
    castEncode("constructor(address)", TREASURY),
  ],
];

const proxyNotes = [
  ["Platform Market ($poly)", PLATFORM_MARKET, MARKET_IMPL_V3],
  ["Platform Token ($poly)", PLATFORM_TOKEN, TOKEN_IMPL],
];

const results = [];
for (const [label, address, path, ctor] of jobs) {
  const ok = verify(address, path, ctor);
  results.push({ label, address, ok });
}

console.log("\n=== Summary ===");
for (const r of results) {
  console.log(`${r.ok ? "OK" : "FAIL"}  ${r.label}  ${r.address}`);
}
console.log("\nClone proxies (source shown after impl verify):");
for (const [label, address, impl] of proxyNotes) {
  console.log(`  ${label}  ${address}  ->  ${impl}`);
}

process.exit(results.every((r) => r.ok) ? 0 : 1);
