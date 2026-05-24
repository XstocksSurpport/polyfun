import { NextResponse } from "next/server";
import { createPublicClient, http, isAddress } from "viem";
import { base, baseSepolia } from "viem/chains";
import { CHAIN_ID, contracts, getConfigError, serverRpcUrl } from "@/lib/config";
import { grindBa5eSaltAvailable } from "@/lib/server/vanity-grind";
import { apiErrorResponse, guardRateLimit, RATE } from "@/lib/server/api-guard";

const VANITY_TIMEOUT_MS = 120_000;

const launcherImplAbi = [
  {
    type: "function",
    name: "tokenImplementation",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "marketImplementation",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
] as const;

async function readLauncherImpls(launcher: `0x${string}`) {
  const chain = CHAIN_ID === 8453 ? base : baseSepolia;
  const client = createPublicClient({ chain, transport: http(serverRpcUrl) });
  const [tokenImplementation, marketImplementation] = await Promise.all([
    client.readContract({
      address: launcher,
      abi: launcherImplAbi,
      functionName: "tokenImplementation",
    }),
    client.readContract({
      address: launcher,
      abi: launcherImplAbi,
      functionName: "marketImplementation",
    }),
  ]);
  return { client, tokenImplementation, marketImplementation };
}

export async function POST(request: Request) {
  const limited = guardRateLimit(request, "vanity", RATE.vanity.limit, RATE.vanity.windowMs);
  if (limited) return limited;

  const configError = getConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 });
  }

  if (!contracts.launcher) {
    return NextResponse.json({ error: "LAUNCHER_ADDRESS_MISSING" }, { status: 503 });
  }

  let body: { creator?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  if (!body.creator || !isAddress(body.creator)) {
    return NextResponse.json({ error: "INVALID_CREATOR" }, { status: 400 });
  }

  try {
    const { client, tokenImplementation, marketImplementation } =
      await readLauncherImpls(contracts.launcher);
    const started = performance.now();

    const result = await Promise.race([
      grindBa5eSaltAvailable(
        client,
        contracts.launcher,
        body.creator as `0x${string}`,
        tokenImplementation,
        marketImplementation
      ),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("VANITY_TIMEOUT")), VANITY_TIMEOUT_MS);
      }),
    ]);

    return NextResponse.json({
      salt: result.rawSalt,
      predictedAddress: result.predictedAddress,
      predictedMarket: result.predictedMarket,
      attempts: result.attempts.toString(),
      elapsedMs: Math.round(performance.now() - started),
      source: "server",
    });
  } catch (error) {
    return apiErrorResponse(error, 500);
  }
}
