import { LaunchForm } from "@/components/launch/LaunchForm";

export default function LaunchPage() {
  return (
    <div className="page-container pb-24">
      <div className="mx-auto w-full max-w-lg">
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tighter text-zinc-950 sm:text-5xl">Launch</h1>
          <p className="mt-3 text-base text-zinc-500 sm:text-lg">
            Deploy a new YES/NO market on Base.
          </p>
        </header>
        <LaunchForm />
      </div>
    </div>
  );
}
