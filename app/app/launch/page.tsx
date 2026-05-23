import dynamic from "next/dynamic";

const LaunchForm = dynamic(() => import("@/components/launch/LaunchForm").then((m) => m.LaunchForm), {
  loading: () => (
    <div className="mx-auto max-w-lg py-16 text-center text-sm text-neutral-400">Loading…</div>
  ),
});

export default function LaunchPage() {
  return (
    <div className="px-4 py-10 sm:px-6">
      <LaunchForm />
    </div>
  );
}
