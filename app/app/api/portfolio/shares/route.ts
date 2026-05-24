import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { contracts, getConfigError } from "@/lib/config";
import { getPublicClient } from "@/lib/server/markets";
import { marketAbi, erc20Abi } from "@/lib/abis";
import { mapMarketStatus } from "@/lib/market-utils";
import { apiErrorResponse, guardRateLimit, RATE } from "@/lib/server/api-guard";

export async function GET(request: Request) {
  const limited = guardRateLimit(request, "portfolio", RATE.portfolio.limit, RATE.portfolio.windowMs);
  if (limited) return limited;

  const configError = getConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const market = searchParams.get("market");
  const account = searchParams.get("account");

  if (!market || !isAddress(market)) {
    return NextResponse.json({ error: "INVALID_MARKET" }, { status: 400 });
  }
  if (!account || !isAddress(account)) {
    return NextResponse.json({ error: "INVALID_ACCOUNT" }, { status: 400 });
  }

  try {
    const client = getPublicClient();
    const results = await client.multicall({
      contracts: [
        { address: market, abi: marketAbi, functionName: "yesShares", args: [account] },
        { address: market, abi: marketAbi, functionName: "noShares", args: [account] },
        { address: market, abi: marketAbi, functionName: "token" },
        { address: market, abi: marketAbi, functionName: "yesClaimed", args: [account] },
        { address: market, abi: marketAbi, functionName: "noClaimed", args: [account] },
        { address: market, abi: marketAbi, functionName: "status" },
        { address: market, abi: marketAbi, functionName: "expiry" },
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

    const statusCode = results[5].result as number | undefined;
    const expiry = results[6].result as bigint | undefined;

    return NextResponse.json({
      yesShares: ((results[0].result as bigint) ?? 0n).toString(),
      noShares: ((results[1].result as bigint) ?? 0n).toString(),
      token: results[2].result as string,
      yesClaimed: Boolean(results[3].result),
      noClaimed: Boolean(results[4].result),
      status: mapMarketStatus(Number(statusCode ?? 2)),
      expiryTs: Number(expiry ?? 0n),
      polyfunBalance: polyfunBalance.toString(),
    });
  } catch (error) {
    return apiErrorResponse(error, 500);
  }
}
