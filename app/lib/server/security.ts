import "server-only";

const buckets = new Map<string, { count: number; resetAt: number }>();

/** Simple in-memory rate limiter for API routes. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hit = buckets.get(key);
  if (!hit || now >= hit.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (hit.count >= limit) return false;
  hit.count += 1;
  return true;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeText(value: string, maxLen: number): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLen);
}

const ALLOWED_IMAGE_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export function isAllowedImageMime(mime: string): boolean {
  return ALLOWED_IMAGE_MIME.has(mime.toLowerCase());
}

export function sanitizeSocialUrl(raw: string | undefined, maxLen = 200): string | undefined {
  if (!raw?.trim()) return undefined;
  const trimmed = sanitizeText(raw, maxLen);
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

const SAFE_ERROR = /^[A-Z][A-Z0-9_]{2,63}$/;

/** Return opaque codes to clients; avoid leaking RPC/stack details. */
export function safeApiError(error: unknown, fallback = "INTERNAL_ERROR"): string {
  if (typeof error === "string" && SAFE_ERROR.test(error)) return error;
  if (error instanceof Error) {
    const msg = error.message.trim();
    if (SAFE_ERROR.test(msg)) return msg;
    if (msg.includes("abort") || msg.includes("timeout") || msg.includes("Timeout")) {
      return "REQUEST_TIMEOUT";
    }
    if (msg.includes("429") || msg.includes("rate limit")) return "RATE_LIMITED";
  }
  return fallback;
}
