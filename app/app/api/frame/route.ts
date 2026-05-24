import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { escapeHtml, guardRateLimit, RATE } from "@/lib/server/api-guard";

function frameHtml({
  market,
  symbol,
  yesRatio,
  imageUrl,
  postUrl,
}: {
  market: string;
  symbol: string;
  yesRatio: string;
  imageUrl: string;
  postUrl: string;
}) {
  const safeMarket = escapeHtml(market);
  const safeSymbol = escapeHtml(symbol);
  const safeYes = escapeHtml(yesRatio);
  const safeImage = escapeHtml(imageUrl);
  const safePost = escapeHtml(postUrl);

  return `<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${safeImage}" />
  <meta property="fc:frame:button:1" content="YES · 0.01" />
  <meta property="fc:frame:button:1:action" content="post" />
  <meta property="fc:frame:button:2" content="NO · 0.01" />
  <meta property="fc:frame:button:2:action" content="post" />
  <meta property="fc:frame:post_url" content="${safePost}" />
  <meta property="fc:frame:input:text" content="market=${safeMarket}" />
  <title>${safeSymbol} · ${safeYes}</title>
</head>
<body></body>
</html>`;
}

export async function GET(request: NextRequest) {
  const limited = guardRateLimit(request, "frame", RATE.frame.limit, RATE.frame.windowMs);
  if (limited) return limited;

  const market = request.nextUrl.searchParams.get("market") ?? "";
  const symbol = (request.nextUrl.searchParams.get("symbol") ?? "MARKET").slice(0, 32);
  const yesRatio = (request.nextUrl.searchParams.get("yes") ?? "0%").slice(0, 16);

  if (!market || !isAddress(market)) {
    return NextResponse.json({ error: "INVALID_MARKET" }, { status: 400 });
  }

  const origin = request.nextUrl.origin;
  const postUrl = `${origin}/api/frame`;
  const imageUrl = `${origin}/api/frame/og?market=${market}&symbol=${encodeURIComponent(symbol)}&yes=${encodeURIComponent(yesRatio)}`;

  return new NextResponse(
    frameHtml({ market, symbol, yesRatio, imageUrl, postUrl }),
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function POST(request: NextRequest) {
  const limited = guardRateLimit(request, "frame", RATE.frame.limit, RATE.frame.windowMs);
  if (limited) return limited;

  let body: Record<string, string> = {};
  try {
    const form = await request.formData();
    form.forEach((value, key) => {
      body[key] = String(value);
    });
  } catch {
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
    }
  }

  const buttonIndex = Number(body["fc:frame:button:index"] ?? body.buttonIndex ?? 0);
  const side = buttonIndex === 2 ? "no" : "yes";
  const marketParam =
    body["fc:frame:input:text"]?.replace("market=", "") ??
    body.market ??
    request.nextUrl.searchParams.get("market") ??
    "";

  if (!marketParam || !isAddress(marketParam)) {
    return NextResponse.json({ error: "INVALID_MARKET" }, { status: 400 });
  }

  const origin = request.nextUrl.origin;
  const marketUrl = `${origin}/markets?market=${marketParam}&side=${side}`;
  const safeSide = escapeHtml(side.toUpperCase());
  const safeMarketUrl = escapeHtml(marketUrl);
  const safeOg = escapeHtml(`${origin}/api/frame/og?market=${marketParam}&side=${side}`);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${safeOg}" />
  <meta property="fc:frame:button:1" content="Open" />
  <meta property="fc:frame:button:1:action" content="link" />
  <meta property="fc:frame:button:1:target" content="${safeMarketUrl}" />
  <title>${safeSide}</title>
</head>
<body></body>
</html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
