import { NextResponse } from "next/server";
import { keccak256, toBytes } from "viem";
import type { TokenMetadata } from "@/lib/types";
import { saveMetadataByHash } from "@/lib/server/metadata-index";
import {
  apiErrorResponse,
  guardRateLimit,
  isAllowedImageMime,
  RATE,
  safeApiError,
  sanitizeSocialUrl,
  sanitizeText,
} from "@/lib/server/api-guard";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const PINATA_TIMEOUT_MS = 20_000;

function parseSocials(form: FormData) {
  return {
    twitter: sanitizeSocialUrl((form.get("twitter") as string | null) ?? undefined),
    telegram: sanitizeSocialUrl((form.get("telegram") as string | null) ?? undefined),
    website: sanitizeSocialUrl((form.get("website") as string | null) ?? undefined),
  };
}

function normalizeMetadata(input: {
  name?: string;
  symbol?: string;
  proposition?: string;
  description?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
}): TokenMetadata | null {
  const name = sanitizeText(input.name ?? "", 80);
  const symbol = sanitizeText(input.symbol ?? "", 16).toUpperCase();
  if (!name || !symbol) return null;

  const proposition = sanitizeText(input.proposition ?? "", 280);
  const description = sanitizeText(input.description ?? proposition, 500);

  return {
    name,
    symbol,
    proposition,
    description,
    twitter: sanitizeSocialUrl(input.twitter),
    telegram: sanitizeSocialUrl(input.telegram),
    website: sanitizeSocialUrl(input.website),
  };
}

async function pinataFetch(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PINATA_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function pinImageToPinata(file: File, pinataJwt: string): Promise<string | undefined> {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error("IMAGE_TOO_LARGE");
  }
  if (!isAllowedImageMime(file.type || "image/png")) {
    throw new Error("INVALID_IMAGE_TYPE");
  }

  const body = new FormData();
  body.append("file", new Blob([buffer], { type: file.type || "image/png" }), file.name || "token.png");
  body.append("pinataMetadata", JSON.stringify({ name: `polyfun-token-${Date.now()}` }));

  const res = await pinataFetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${pinataJwt}` },
    body,
  });

  if (!res.ok) throw new Error("PINATA_IMAGE_UPLOAD_FAILED");
  const data = (await res.json()) as { IpfsHash: string };
  const gateway = process.env.PINATA_GATEWAY ?? "https://gateway.pinata.cloud/ipfs";
  return `${gateway.replace(/\/$/, "")}/${data.IpfsHash}`;
}

async function pinJsonToPinata(metadata: TokenMetadata, pinataJwt: string) {
  const res = await pinataFetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pinataJwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: { name: `${metadata.symbol}-polyfun-metadata` },
    }),
  });

  if (!res.ok) throw new Error("PINATA_UPLOAD_FAILED");
  const data = (await res.json()) as { IpfsHash: string };
  const gateway = process.env.PINATA_GATEWAY ?? "https://gateway.pinata.cloud/ipfs";
  return {
    ipfsHash: data.IpfsHash,
    uri: `${gateway.replace(/\/$/, "")}/${data.IpfsHash}`,
  };
}

export async function POST(request: Request) {
  const limited = guardRateLimit(request, "metadata", RATE.metadata.limit, RATE.metadata.windowMs);
  if (limited) return limited;

  const pinataJwt = process.env.PINATA_JWT;
  const contentType = request.headers.get("content-type") ?? "";

  let metadata: TokenMetadata;
  let imageFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const normalized = normalizeMetadata({
      name: (form.get("name") as string | null) ?? undefined,
      symbol: (form.get("symbol") as string | null) ?? undefined,
      proposition: (form.get("proposition") as string | null) ?? undefined,
      description: (form.get("description") as string | null) ?? undefined,
      ...parseSocials(form),
    });
    if (!normalized) {
      return NextResponse.json({ error: "NAME_SYMBOL_REQUIRED" }, { status: 400 });
    }
    metadata = normalized;
    imageFile = form.get("image") instanceof File ? (form.get("image") as File) : null;
  } else {
    let body: TokenMetadata;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
    }
    const normalized = normalizeMetadata(body);
    if (!normalized) {
      return NextResponse.json({ error: "NAME_SYMBOL_REQUIRED" }, { status: 400 });
    }
    metadata = normalized;
  }

  try {
    if (imageFile && imageFile.size > 0) {
      if (pinataJwt) {
        try {
          metadata.image = await pinImageToPinata(imageFile, pinataJwt);
        } catch {
          const buffer = Buffer.from(await imageFile.arrayBuffer());
          if (buffer.length > 512_000) {
            return NextResponse.json({ error: "IMAGE_TOO_LARGE_DEV" }, { status: 400 });
          }
          const mime = imageFile.type || "image/png";
          if (!isAllowedImageMime(mime)) {
            return NextResponse.json({ error: "INVALID_IMAGE_TYPE" }, { status: 400 });
          }
          metadata.image = `data:${mime};base64,${buffer.toString("base64")}`;
        }
      } else {
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        if (buffer.length > 512_000) {
          return NextResponse.json({ error: "IMAGE_TOO_LARGE_DEV" }, { status: 400 });
        }
        const mime = imageFile.type || "image/png";
        if (!isAllowedImageMime(mime)) {
          return NextResponse.json({ error: "INVALID_IMAGE_TYPE" }, { status: 400 });
        }
        metadata.image = `data:${mime};base64,${buffer.toString("base64")}`;
      }
    }

    const metadataHash = keccak256(toBytes(JSON.stringify(metadata))) as `0x${string}`;

    if (pinataJwt) {
      try {
        const pinned = await pinJsonToPinata(metadata, pinataJwt);
        saveMetadataByHash(metadataHash, {
          ...metadata,
          ipfsHash: pinned.ipfsHash,
          uri: pinned.uri,
        });
        return NextResponse.json({
          metadataHash,
          ipfsHash: pinned.ipfsHash,
          uri: pinned.uri,
        });
      } catch (pinataErr) {
        saveMetadataByHash(metadataHash, metadata);
        return NextResponse.json({
          metadataHash,
          warning: "Pinata unavailable — using on-chain metadata hash only",
          detail: safeApiError(pinataErr),
        });
      }
    }

    saveMetadataByHash(metadataHash, metadata);
    return NextResponse.json({
      metadataHash,
      warning: "PINATA_JWT_MISSING — metadata hash ready for launch",
    });
  } catch (error) {
    return apiErrorResponse(error, 500);
  }
}
