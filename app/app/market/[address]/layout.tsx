import type { Metadata } from "next";

type Props = { params: Promise<{ address: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const frameUrl = `${baseUrl}/api/frame?market=${address}`;

  return {
    title: "Market",
    other: {
      "fc:frame": "vNext",
      "fc:frame:image": `${baseUrl}/api/frame/og?market=${address}`,
      "fc:frame:button:1": "YES",
      "fc:frame:button:2": "NO",
      "fc:frame:post_url": `${baseUrl}/api/frame`,
    },
    openGraph: {
      images: [`${baseUrl}/api/frame/og?market=${address}`],
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/market/${address}`,
    },
    description: frameUrl,
  };
}

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return children;
}
