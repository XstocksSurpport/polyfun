import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { getConfigError } from "@/lib/config";
import { listMarketTrades } from "@/lib/server/trades";

interface RouteParams {
  params: Promise<{ address: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const configError = getConfigError();
  if (configError) {
    return NextResponse.json({ error: configError, trades: [] }, { status: 503 });
  }

  const { address } = await params;
  if (!isAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const trades = await listMarketTrades(address);
    return NextResponse.json({
      trades: trades.map((t) => ({
        ...t,
        amountWei: t.amountWei.toString(),
        shares: t.shares.toString(),
        blockNumber: t.blockNumber.toString(),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load trades";
    return NextResponse.json({ error: message, trades: [] }, { status: 500 });
  }
}
