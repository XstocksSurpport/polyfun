import { NextResponse } from "next/server";
import { keccak256, toBytes } from "viem";
import type { TokenMetadata } from "@/lib/types";

export async function POST(request: Request) {
  const pinataJwt = process.env.PINATA_JWT;
  const pinataGateway = process.env.PINATA_GATEWAY;

  if (!pinataJwt) {
    return NextResponse.json(
      {
        error: "PINATA_JWT_MISSING",
      },
      { status: 503 }
    );
  }

  let body: TokenMetadata;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  if (!body.name?.trim() || !body.symbol?.trim()) {
    return NextResponse.json({ error: "NAME_SYMBOL_REQUIRED" }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pinataJwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pinataContent: body,
        pinataMetadata: { name: `${body.symbol}-polyfun-metadata` },
      }),
    });

    if (!res.ok) {
      await res.text();
      return NextResponse.json({ error: "PINATA_UPLOAD_FAILED" }, { status: 502 });
    }

    const data = (await res.json()) as { IpfsHash: string };
    const metadataHash = keccak256(toBytes(JSON.stringify(body)));

    return NextResponse.json({
      ipfsHash: data.IpfsHash,
      metadataHash,
      uri: pinataGateway
        ? `${pinataGateway}/${data.IpfsHash}`
        : `https://ipfs.io/ipfs/${data.IpfsHash}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
