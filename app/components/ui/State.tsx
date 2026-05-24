import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";

export function LoadingBlock() {
  return <p className="py-16 text-center text-sm text-zinc-500 animate-pulse-soft">Loading…</p>;
}

export function EmptyBlock() {
  return (
    <div className="py-16 text-center">
      <h3 className="text-sm font-semibold text-zinc-950">No markets yet</h3>
      <LinkButton href="/launch" variant="primary" size="md" className="mt-4">
        New Project
      </LinkButton>
    </div>
  );
}

export function SetupBlock() {
  return (
    <div className="py-16 text-center">
      <h3 className="text-sm font-semibold text-zinc-950">Contracts not deployed</h3>
      <p className="mt-2 text-sm text-zinc-500">Configure launcher addresses in app/.env.local</p>
      <Link href="/docs" className="mt-4 inline-block text-sm font-medium text-zinc-950 underline underline-offset-4">
        Setup guide
      </Link>
    </div>
  );
}

export function ErrorBlock({ code }: { code: string }) {
  return <p className="py-12 text-center text-sm text-zinc-500">{code}</p>;
}
