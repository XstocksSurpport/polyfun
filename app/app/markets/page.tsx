import { Suspense } from "react";
import { MarketsPageContent } from "@/components/markets/MarketsPageContent";

export default function MarketsPage() {
  return (
    <Suspense
      fallback={
        <p className="py-24 text-center text-sm text-zinc-500 animate-pulse-soft">Loading…</p>
      }
    >
      <MarketsPageContent />
    </Suspense>
  );
}
