import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { getConfigError } from "@/lib/config";
import { invalidateAllMarketData, listMarkets, loadMarketCached } from "@/lib/server/markets";
import { apiErrorResponse, guardRateLimit, RATE } from "@/lib/server/api-guard";

export async function GET(request: Request) {
  const limited = guardRateLimit(request, "markets", RATE.markets.limit, RATE.markets.windowMs);
  if (limited) return limited;

  const configError = getConfigError();
  if (configError) {
    return NextResponse.json({ error: configError, markets: [] }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  if (searchParams.get("fresh") === "1") {
    const freshLimited = guardRateLimit(
      request,
      "markets-fresh",
      RATE.marketsFresh.limit,
      RATE.marketsFresh.windowMs
    );
    if (freshLimited) return freshLimited;
    invalidateAllMarketData();
  }

  try {
    if (address) {
      if (!isAddress(address)) {
        return NextResponse.json({ error: "INVALID_ADDRESS" }, { status: 400 });
      }
      const market = await loadMarketCached(address);
      if (!market) {
        return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      }
      return NextResponse.json(
        { market: serializeMarket(market) },
        {
          headers: {
            "Cache-Control":
              searchParams.get("fresh") === "1"
                ? "no-store"
                : "public, s-maxage=5, stale-while-revalidate=15",
          },
        }
      );
    }

    const markets = await listMarkets();
    return NextResponse.json(
      { markets: markets.map(serializeMarket) },
      { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" } }
    );
  } catch (error) {
    return apiErrorResponse(error, 500, { markets: [] });
  }
}

import type { Market } from "@/lib/types";

function serializeMarket(market: Market) {
  return {
    ...market,
    yesValueWei: market.yesValueWei.toString(),
    noValueWei: market.noValueWei.toString(),
  };
}
