import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { loadExternalOptionState } from "@/lib/server/external-option";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
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
    const message = error instanceof Error ? error.message : "LOAD_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
