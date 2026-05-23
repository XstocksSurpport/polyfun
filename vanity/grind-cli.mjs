#!/usr/bin/env node
import { grindSalt, readLauncherImpls } from "./lib/grind.mjs";

const launcher = process.argv[2] ?? process.env.LAUNCHER_ADDRESS;
const chainId = Number(process.argv[3] ?? process.env.CHAIN_ID ?? "84532");

if (!launcher) {
  console.error("Usage: node grind-cli.mjs <launcher> [chainId]");
  process.exit(1);
}

const { tokenImplementation } = await readLauncherImpls(launcher, chainId);
console.log(`Grinding pppp salt for launcher ${launcher}…`);

const started = Date.now();
const { salt, predictedAddress, attempts } = grindSalt(launcher, tokenImplementation, {
  onProgress: (n) => process.stdout.write(`\r${n} attempts…`),
});

console.log(`\nFound in ${attempts} attempts (${Date.now() - started}ms)`);
console.log(JSON.stringify({ salt, predictedAddress, attempts: attempts.toString() }, null, 2));
