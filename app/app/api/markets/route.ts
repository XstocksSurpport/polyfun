import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { getConfigError } from "@/lib/config";
import { listMarkets, loadMarket } from "@/lib/server/markets";

export async function GET(request: Request) {
  const configError = getConfigError();
  if (configError) {
    return NextResponse.json({ error: configError, markets: [] }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  try {
    if (address) {
      if (!isAddress(address)) {
        return NextResponse.json({ error: "Invalid address" }, { status: 400 });
      }
      const market = await loadMarket(address);
      if (!market) {
        return NextResponse.json({ error: "Market not found" }, { status: 404 });
      }
      return NextResponse.json({ market: serializeMarket(market) });
    }

    const markets = await listMarkets();
    return NextResponse.json({
      markets: markets.map(serializeMarket),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load markets";
    return NextResponse.json({ error: message, markets: [] }, { status: 500 });
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
