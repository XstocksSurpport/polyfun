interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="page-container flex flex-col gap-6 pb-8 pt-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-4xl font-bold tracking-tighter text-zinc-950 sm:text-5xl">{title}</h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-lg text-zinc-500">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
