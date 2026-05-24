import { CopyAddressButton } from "@/components/ui/CopyAddressButton";
import {
  DEPLOYMENTS,
  explorerAddressUrl,
  getContractAddressRows,
} from "@/lib/deployments";
import { FEE_RECEIVER } from "@/lib/protocol";

export function DocsContractAddresses() {
  const rows = getContractAddressRows();

  return (
    <section className="page-container mb-10">
      <h2 className="text-lg font-bold tracking-tight text-zinc-950">Contract Addresses</h2>
      <p className="mt-1.5 text-sm text-zinc-500">
        Base mainnet (Chain ID {DEPLOYMENTS.chainId}) — active protocol contracts. Internal market
        duration: {DEPLOYMENTS.marketDurationHours} hours.
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/80">
              <th className="px-4 py-2.5 font-medium text-zinc-500">Contract</th>
              <th className="px-4 py-2.5 font-medium text-zinc-500">Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <tr key={row.label} className="transition-colors hover:bg-zinc-50/50">
                <td className="px-4 py-2.5 align-top">
                  <span className="font-medium text-zinc-950">{row.label}</span>
                  {row.note ? (
                    <p className="mt-0.5 text-xs text-zinc-400">{row.note}</p>
                  ) : null}
                </td>
                <td className="px-4 py-2.5 align-top">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="break-all font-mono text-xs text-zinc-700">{row.address}</code>
                    <CopyAddressButton address={row.address} />
                    <a
                      href={explorerAddressUrl(row.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs text-zinc-400 underline hover:text-zinc-700"
                    >
                      ↗
                    </a>
                  </div>
                </td>
              </tr>
            ))}
            <tr className="transition-colors hover:bg-zinc-50/50">
              <td className="px-4 py-2.5 align-top">
                <span className="font-medium text-zinc-950">Fee Receiver (Treasury)</span>
                <p className="mt-0.5 text-xs text-zinc-400">Protocol revenue destination</p>
              </td>
              <td className="px-4 py-2.5 align-top">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="break-all font-mono text-xs text-zinc-700">{FEE_RECEIVER}</code>
                  <CopyAddressButton address={FEE_RECEIVER} />
                  <a
                    href={explorerAddressUrl(FEE_RECEIVER)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs text-zinc-400 underline hover:text-zinc-700"
                  >
                    ↗
                  </a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
