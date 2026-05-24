import { concat, getCreate2Address, keccak256, pad, type Address, type Hash } from "viem";

/** Last 4 bytes of address must equal 0x70707070 (displays as …70707070 / pppp). */
export const PPPP_SUFFIX = 0x70707070n;

const CLONE_PREFIX = "0x3d602d80600a3d3981f3363d573d3d3d363d73" as const;
const CLONE_SUFFIX = "0x5af43d82803e903d91602b57fd5bf3" as const;

export function hasPpppSuffix(address: string) {
  return (BigInt(address.toLowerCase()) & 0xffffffffn) === PPPP_SUFFIX;
}

export function cloneBytecodeHash(implementation: Address): Hash {
  const bytecode = concat([
    CLONE_PREFIX,
    pad(implementation, { size: 20 }),
    CLONE_SUFFIX,
  ]);
  return keccak256(bytecode);
}

export function predictCloneAddress(
  launcher: Address,
  tokenImplementation: Address,
  salt: Hash
): Address {
  return getCreate2Address({
    from: launcher,
    salt,
    bytecodeHash: cloneBytecodeHash(tokenImplementation),
  });
}

export function defaultWorkerCount() {
  if (typeof navigator === "undefined") return 4;
  return Math.min(Math.max(navigator.hardwareConcurrency ?? 4, 2), 8);
}
