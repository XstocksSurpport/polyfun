import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ address: string }>;
  searchParams: Promise<{ side?: string }>;
};

/** Legacy /market/* URLs → home trade modal */
export default async function MarketRedirect({ params, searchParams }: Props) {
  const { address } = await params;
  const { side } = await searchParams;
  const tradeSide = side === "no" ? "no" : "yes";
  redirect(`/markets?market=${address}&side=${tradeSide}`);
}
