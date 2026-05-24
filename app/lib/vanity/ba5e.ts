import {
  concat,
  encodePacked,
  getCreate2Address,
  keccak256,
  pad,
  toHex,
  type Address,
  type Hash,
} from "viem";
import { CLONE_PREFIX, CLONE_SUFFIX } from "./digest";

/** Minimal client for bytecode checks — avoids viem PublicClient transport variance. */
export type BytecodeClient = {
  getBytecode(args: { address: Address }): Promise<`0x${string}` | undefined>;
};

/** Last 2 bytes = 0xBA5E → address ends with …ba5e (1/65536). */
export const BA5E_SUFFIX = 0xba5en;

const CLONE_PREFIX_LOCAL = CLONE_PREFIX;
const CLONE_SUFFIX_LOCAL = CLONE_SUFFIX;

export function hasBa5eSuffix(address: string) {
  return (BigInt(address.toLowerCase()) & 0xffffn) === BA5E_SUFFIX;
}

export function boundSalt(creator: Address, rawSalt: Hash): Hash {
  return keccak256(encodePacked(["address", "bytes32"], [creator, rawSalt]));
}

export function marketSalt(finalSalt: Hash): Hash {
  return keccak256(encodePacked(["bytes32", "string"], [finalSalt, "POLYFUN_MARKET"]));
}

export function cloneBytecodeHash(implementation: Address): Hash {
  return keccak256(
    concat([CLONE_PREFIX_LOCAL, pad(implementation, { size: 20 }), CLONE_SUFFIX_LOCAL])
  );
}

export function predictTokenAddress(
  launcher: Address,
  creator: Address,
  tokenImplementation: Address,
  rawSalt: Hash
): Address {
  return getCreate2Address({
    from: launcher,
    salt: boundSalt(creator, rawSalt),
    bytecodeHash: cloneBytecodeHash(tokenImplementation),
  });
}

export function predictMarketAddress(
  launcher: Address,
  creator: Address,
  marketImplementation: Address,
  rawSalt: Hash
): Address {
  const finalSalt = boundSalt(creator, rawSalt);
  return getCreate2Address({
    from: launcher,
    salt: marketSalt(finalSalt),
    bytecodeHash: cloneBytecodeHash(marketImplementation),
  });
}

async function isAddressAvailable(client: BytecodeClient, address: Address) {
  const code = await client.getBytecode({ address });
  return !code || code === "0x";
}

/** Sync grind — skips suffix check only (legacy). Prefer grindBa5eSaltAvailable. */
export function grindBa5eSalt(
  launcher: Address,
  creator: Address,
  tokenImplementation: Address,
  start = Math.floor(Math.random() * 1_000_000)
) {
  const bytecodeHash = cloneBytecodeHash(tokenImplementation);
  for (let i = start; ; i++) {
    const rawSalt = pad(toHex(i), { size: 32 });
    const predicted = getCreate2Address({
      from: launcher,
      salt: boundSalt(creator, rawSalt),
      bytecodeHash,
    });
    if (hasBa5eSuffix(predicted)) {
      return { rawSalt, predictedAddress: predicted, attempts: i - start + 1 };
    }
  }
}

/** On-chain grind — requires empty token + market clone addresses. */
export async function grindBa5eSaltAvailable(
  client: BytecodeClient,
  launcher: Address,
  creator: Address,
  tokenImplementation: Address,
  marketImplementation: Address,
  start = Math.floor(Math.random() * 1_000_000)
) {
  const tokenHash = cloneBytecodeHash(tokenImplementation);
  const marketHash = cloneBytecodeHash(marketImplementation);

  for (let i = start; ; i++) {
    const rawSalt = pad(toHex(i), { size: 32 });
    const finalSalt = boundSalt(creator, rawSalt);
    const predictedAddress = getCreate2Address({
      from: launcher,
      salt: finalSalt,
      bytecodeHash: tokenHash,
    });

    if (!hasBa5eSuffix(predictedAddress)) continue;

    const predictedMarket = getCreate2Address({
      from: launcher,
      salt: marketSalt(finalSalt),
      bytecodeHash: marketHash,
    });

    const [tokenFree, marketFree] = await Promise.all([
      isAddressAvailable(client, predictedAddress),
      isAddressAvailable(client, predictedMarket),
    ]);

    if (!tokenFree || !marketFree) continue;

    return {
      rawSalt,
      predictedAddress,
      predictedMarket,
      attempts: i - start + 1,
    };
  }
}

export async function validateSaltAvailable(
  client: BytecodeClient,
  launcher: Address,
  creator: Address,
  tokenImplementation: Address,
  marketImplementation: Address,
  rawSalt: Hash
) {
  const token = predictTokenAddress(launcher, creator, tokenImplementation, rawSalt);
  const market = predictMarketAddress(launcher, creator, marketImplementation, rawSalt);

  const [tokenFree, marketFree, suffixOk] = await Promise.all([
    isAddressAvailable(client, token),
    isAddressAvailable(client, market),
    Promise.resolve(hasBa5eSuffix(token)),
  ]);

  return { token, market, tokenFree, marketFree, suffixOk, ok: suffixOk && tokenFree && marketFree };
}
