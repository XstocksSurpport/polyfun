import { createPublicClient, getCreate2Address, http, keccak256, concat, pad, toHex } from "viem";
import { base, baseSepolia } from "viem/chains";

export const PPPP_SUFFIX = 0x70707070n;

const CLONE_PREFIX = "0x3d602d80600a3d3981f3363d573d3d3d363d73";
const CLONE_SUFFIX = "0x5af43d82803e903d91602b57fd5bf3";

export function cloneBytecodeHash(implementation) {
  const bytecode = concat([
    CLONE_PREFIX,
    pad(implementation, { size: 20 }),
    CLONE_SUFFIX,
  ]);
  return keccak256(bytecode);
}

export function predictTokenAddress(launcher, tokenImplementation, salt) {
  return getCreate2Address({
    from: launcher,
    salt,
    bytecodeHash: cloneBytecodeHash(tokenImplementation),
  });
}

export function hasPpppSuffix(address) {
  const lower = BigInt(address.toLowerCase());
  return (lower & 0xffffffffn) === PPPP_SUFFIX;
}

export function grindSalt(launcher, tokenImplementation, { start = 0n, onProgress } = {}) {
  const hash = cloneBytecodeHash(tokenImplementation);
  let i = start;

  while (true) {
    const salt = pad(toHex(i), { size: 32 });
    const predicted = getCreate2Address({
      from: launcher,
      salt,
      bytecodeHash: hash,
    });

    if (hasPpppSuffix(predicted)) {
      return { salt, predictedAddress: predicted, attempts: i - start + 1n };
    }

    if (onProgress && i % 500_000n === 0n) {
      onProgress(i);
    }
    i += 1n;
  }
}

export async function readLauncherImpls(launcherAddress, chainId) {
  const chain = chainId === 8453 ? base : baseSepolia;
  const client = createPublicClient({
    chain,
    transport: http(
      chainId === 8453
        ? process.env.BASE_RPC_URL ?? "https://mainnet.base.org"
        : process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org"
    ),
  });

  const tokenImplementation = await client.readContract({
    address: launcherAddress,
    abi: [
      {
        type: "function",
        name: "tokenImplementation",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "address" }],
      },
    ],
    functionName: "tokenImplementation",
  });

  return { tokenImplementation };
}
