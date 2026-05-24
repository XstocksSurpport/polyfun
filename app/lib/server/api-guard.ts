import "server-only";

import { NextResponse } from "next/server";
import { clientIp, rateLimit, safeApiError } from "./security";

export { clientIp, escapeHtml, isAllowedImageMime, rateLimit, safeApiError, sanitizeSocialUrl, sanitizeText } from "./security";

/** Standard rate-limit windows */
export const RATE = {
  markets: { limit: 120, windowMs: 60_000 },
  marketsFresh: { limit: 8, windowMs: 60_000 },
  trades: { limit: 90, windowMs: 60_000 },
  metadata: { limit: 12, windowMs: 60_000 },
  vanity: { limit: 6, windowMs: 60_000 },
  portfolio: { limit: 120, windowMs: 60_000 },
  platform: { limit: 60, windowMs: 60_000 },
  frame: { limit: 90, windowMs: 60_000 },
} as const;

export function guardRateLimit(
  request: Request,
  bucket: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const ip = clientIp(request);
  if (rateLimit(`${bucket}:${ip}`, limit, windowMs)) return null;
  return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
}

export function apiErrorResponse(
  error: unknown,
  status = 500,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    { error: safeApiError(error), ...extra },
    { status }
  );
}
