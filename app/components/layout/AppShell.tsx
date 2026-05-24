import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <div className="bg-dot-grid flex min-h-dvh flex-col">
        <main className="flex-1 pb-4 pt-14">{children}</main>
        <SiteFooter />
      </div>
    </>
  );
}
