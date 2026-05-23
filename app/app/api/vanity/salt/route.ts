import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { getConfigError } from "@/lib/config";

export async function POST(request: Request) {
  const configError = getConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 });
  }

  const vanityUrl = process.env.VANITY_SERVICE_URL;
  if (!vanityUrl) {
    return NextResponse.json(
      {
        error: "VANITY_SERVICE_URL_MISSING",
      },
      { status: 503 }
    );
  }

  let body: { creator?: string; chainId?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  if (!body.creator || !isAddress(body.creator)) {
    return NextResponse.json({ error: "INVALID_CREATOR" }, { status: 400 });
  }

  try {
    const res = await fetch(`${vanityUrl.replace(/\/$/, "")}/salt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? "VANITY_FAILED" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vanity service unreachable";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
