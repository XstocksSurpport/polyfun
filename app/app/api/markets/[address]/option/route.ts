import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { loadExternalOptionState } from "@/lib/server/external-option";
import { apiErrorResponse, guardRateLimit, RATE } from "@/lib/server/api-guard";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const limited = guardRateLimit(request, "option", RATE.trades.limit, RATE.trades.windowMs);
  if (limited) return limited;

  const { address } = await params;

  if (!isAddress(address)) {
    return NextResponse.json({ error: "INVALID_ADDRESS" }, { status: 400 });
  }

  try {
    const state = await loadExternalOptionState(address);
    if (!state) {
      return NextResponse.json({ error: "NOT_MIGRATED" }, { status: 404 });
    }
    return NextResponse.json({ option: state });
  } catch (error) {
    return apiErrorResponse(error, 500);
  }
}
