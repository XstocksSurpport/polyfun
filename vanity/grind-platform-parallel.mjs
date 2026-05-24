import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getCreate2Address, keccak256, pad, toHex } from "viem";

const BA5E_SUFFIX = 0xba5en;
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function hasBa5eSuffix(address) {
  return (BigInt(address.toLowerCase()) & 0xffffn) === BA5E_SUFFIX;
}

/** Must match DeployPlatformToken.s.sol: keccak256(creationCode ++ abi.encode(treasury)). */
function platformInitCodeHash() {
  const out = execSync("forge test --match-test test_platformInitCodeHash -vv", {
    cwd: join(root, "contracts"),
    encoding: "utf8",
  });
  const match = out.match(/0x[a-fA-F0-9]{64}/);
  if (!match) {
    throw new Error("Could not read platform initCodeHash from forge test");
  }
  return match[0];
}

const factory = process.argv[2];
if (!factory) {
  console.error("Usage: node grind-platform-parallel.mjs <factory>");
  process.exit(1);
}

const initCodeHash = platformInitCodeHash();
const started = Date.now();
const start = Math.floor(Math.random() * 1_000_000);

for (let i = start; ; i++) {
  const salt = pad(toHex(i), { size: 32 });
  const predicted = getCreate2Address({ from: factory, salt, bytecodeHash: initCodeHash });
  if (hasBa5eSuffix(predicted)) {
    console.log(
      JSON.stringify({
        salt,
        predictedAddress: predicted,
        initCodeHash,
        attempts: i - start + 1,
        elapsedMs: Date.now() - started,
      })
    );
    process.exit(0);
  }
}
