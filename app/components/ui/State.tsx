export function LoadingBlock() {
  return <div className="py-16 text-center text-sm text-neutral-300">...</div>;
}

export function EmptyBlock() {
  return <div className="py-16" />;
}

export function ErrorBlock({ code }: { code: string }) {
  return (
    <div className="rounded-xl border border-neutral-100 py-8 text-center text-sm text-no">
      {code}
    </div>
  );
}
