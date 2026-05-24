import { NextResponse } from "next/server";
import { erc20Abi } from "@/lib/abis";
import { contracts } from "@/lib/config";
import { getPublicClient } from "@/lib/server/markets";
import { apiErrorResponse, guardRateLimit, RATE } from "@/lib/server/api-guard";

export async function GET(request: Request) {
  const limited = guardRateLimit(request, "platform", RATE.platform.limit, RATE.platform.windowMs);
  if (limited) return limited;

  if (!contracts.polyfun) {
    return NextResponse.json({ error: "POLYFUN_ADDRESS_MISSING" }, { status: 503 });
  }

  try {
    const client = getPublicClient();
    const [name, symbol, totalSupply] = await client.multicall({
      contracts: [
        { address: contracts.polyfun, abi: erc20Abi, functionName: "name" },
        { address: contracts.polyfun, abi: erc20Abi, functionName: "symbol" },
        { address: contracts.polyfun, abi: erc20Abi, functionName: "totalSupply" },
      ],
    });

    return NextResponse.json({
      address: contracts.polyfun,
      name: (name.result as string) ?? "Polyfun",
      symbol: (symbol.result as string) ?? "POLY",
      totalSupply: ((totalSupply.result as bigint) ?? 0n).toString(),
    });
  } catch (error) {
    return apiErrorResponse(error, 500);
  }
}
