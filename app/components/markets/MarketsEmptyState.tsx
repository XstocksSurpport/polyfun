import { LinkButton } from "@/components/ui/Button";

export function MarketsEmptyState() {
  return (
    <div className="rounded-ui border border-zinc-200 py-16 text-center">
      <h2 className="text-lg font-semibold text-zinc-950">No active markets</h2>
      <p className="mt-2 text-sm text-zinc-500">Launch a token to start the prediction pool.</p>
      <LinkButton href="/launch" variant="primary" size="md" className="mt-6">
        New Project
      </LinkButton>
    </div>
  );
}
