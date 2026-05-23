import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { getConfigError } from "@/lib/config";
import { getPublicClient } from "@/lib/server/markets";
import { marketAbi, erc20Abi } from "@/lib/abis";
import { contracts } from "@/lib/config";

export async function GET(request: Request) {
  const configError = getConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const market = searchParams.get("market");
  const account = searchParams.get("account");

  if (!market || !isAddress(market)) {
    return NextResponse.json({ error: "Invalid market" }, { status: 400 });
  }
  if (!account || !isAddress(account)) {
    return NextResponse.json({ error: "Invalid account" }, { status: 400 });
  }

  try {
    const client = getPublicClient();
    const [yesShares, noShares, tokenAddr] = await client.multicall({
      contracts: [
        { address: market, abi: marketAbi, functionName: "yesShares", args: [account] },
        { address: market, abi: marketAbi, functionName: "noShares", args: [account] },
        { address: market, abi: marketAbi, functionName: "token" },
      ],
    });

    let polyfunBalance = 0n;
    if (contracts.polyfun) {
      polyfunBalance = await client.readContract({
        address: contracts.polyfun,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account],
      });
    }

    return NextResponse.json({
      yesShares: ((yesShares.result as bigint) ?? 0n).toString(),
      noShares: ((noShares.result as bigint) ?? 0n).toString(),
      token: tokenAddr.result as string,
      polyfunBalance: polyfunBalance.toString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load shares";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
