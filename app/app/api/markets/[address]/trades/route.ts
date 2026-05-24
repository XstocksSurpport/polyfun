import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { getConfigError } from "@/lib/config";
import { loadMarketCached } from "@/lib/server/markets";
import { getCachedTrades } from "@/lib/server/trade-cache";
import { listMarketTrades } from "@/lib/server/trades";
import { apiErrorResponse, guardRateLimit, RATE } from "@/lib/server/api-guard";

interface RouteParams {
  params: Promise<{ address: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const limited = guardRateLimit(request, "trades", RATE.trades.limit, RATE.trades.windowMs);
  if (limited) return limited;

  const configError = getConfigError();
  if (configError) {
    return NextResponse.json({ error: configError, trades: [] }, { status: 503 });
  }

  const { address } = await params;
  if (!isAddress(address)) {
    return NextResponse.json({ error: "INVALID_ADDRESS" }, { status: 400 });
  }

  try {
    const market = await loadMarketCached(address);
    const trades = await getCachedTrades(address, () =>
      listMarketTrades(address, market?.createdAt)
    );
    return NextResponse.json(
      {
        trades: trades.map((t) => ({
          ...t,
          amountWei: t.amountWei.toString(),
          shares: t.shares.toString(),
          blockNumber: t.blockNumber.toString(),
        })),
      },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (error) {
    return apiErrorResponse(error, 500, { trades: [] });
  }
}
