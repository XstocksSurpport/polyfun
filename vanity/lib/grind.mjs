import { createPublicClient, concat, encodePacked, getCreate2Address, http, keccak256, pad, toHex } from "viem";
import { base, baseSepolia } from "viem/chains";

export const BA5E_SUFFIX = 0xba5en;

const CLONE_PREFIX = "0x3d602d80600a3d3981f3363d3d373d3d3d363d73";
const CLONE_SUFFIX = "0x5af43d82803e903d91602b57fd5bf3";

export function boundSalt(creator, rawSalt) {
  return keccak256(encodePacked(["address", "bytes32"], [creator, rawSalt]));
}

export function cloneBytecodeHash(implementation) {
  return keccak256(
    concat([CLONE_PREFIX, pad(implementation, { size: 20 }), CLONE_SUFFIX])
  );
}

export function predictTokenAddress(launcher, creator, tokenImplementation, rawSalt) {
  return getCreate2Address({
    from: launcher,
    salt: boundSalt(creator, rawSalt),
    bytecodeHash: cloneBytecodeHash(tokenImplementation),
  });
}

export function hasBa5eSuffix(address) {
  return (BigInt(address.toLowerCase()) & 0xffffn) === BA5E_SUFFIX;
}

export function grindSalt(launcher, creator, tokenImplementation, { start = 0, exclude = [] } = {}) {
  const hash = cloneBytecodeHash(tokenImplementation);
  const excluded = new Set(exclude.map((a) => a.toLowerCase()));
  for (let i = start; ; i++) {
    const rawSalt = pad(toHex(i), { size: 32 });
    const predicted = getCreate2Address({
      from: launcher,
      salt: boundSalt(creator, rawSalt),
      bytecodeHash: hash,
    });

    if (hasBa5eSuffix(predicted) && !excluded.has(predicted.toLowerCase())) {
      return { salt: rawSalt, predictedAddress: predicted, attempts: i - start + 1 };
    }
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
