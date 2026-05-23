import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";

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
  return `<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${imageUrl}" />
  <meta property="fc:frame:button:1" content="YES · 0.01" />
  <meta property="fc:frame:button:1:action" content="post" />
  <meta property="fc:frame:button:2" content="NO · 0.01" />
  <meta property="fc:frame:button:2:action" content="post" />
  <meta property="fc:frame:post_url" content="${postUrl}" />
  <meta property="fc:frame:input:text" content="market=${market}" />
  <title>${symbol} · ${yesRatio}</title>
</head>
<body></body>
</html>`;
}

export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get("market") ?? "";
  const symbol = request.nextUrl.searchParams.get("symbol") ?? "MARKET";
  const yesRatio = request.nextUrl.searchParams.get("yes") ?? "0%";

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
  const marketUrl = `${origin}/market/${marketParam}?side=${side}&amount=0.01`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${origin}/api/frame/og?market=${marketParam}&side=${side}" />
  <meta property="fc:frame:button:1" content="Open" />
  <meta property="fc:frame:button:1:action" content="link" />
  <meta property="fc:frame:button:1:target" content="${marketUrl}" />
  <title>${side.toUpperCase()}</title>
</head>
<body></body>
</html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
