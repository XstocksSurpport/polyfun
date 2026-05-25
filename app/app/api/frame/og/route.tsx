import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbol = searchParams.get("symbol") ?? "MARKET";
  const yes = searchParams.get("yes") ?? "";
  const side = searchParams.get("side") ?? "";

  const line2 = side ? `${side.toUpperCase()} · polyfun.wtf` : yes ? `YES ${yes}` : "polyfun.wtf";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 48,
          background: "#ffffff",
          color: "#171717",
        }}
      >
        <div style={{ fontSize: 48, fontWeight: 600 }}>${symbol}</div>
        <div style={{ fontSize: 28, marginTop: 16, color: "#737373" }}>{line2}</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
