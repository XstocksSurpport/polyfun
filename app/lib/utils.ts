import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEth(value: number | bigint, digits = 4) {
  return `${formatEthAmount(value, digits)} ETH`;
}

/** ETH amount without the trailing unit (for custom labels). */
export function formatEthAmount(value: number | bigint, digits = 4) {
  const num = typeof value === "bigint" ? Number(value) / 1e18 : value;
  return num.toFixed(digits);
}

/** Volume label — extra precision for small pools. */
export function formatEthVol(value: number | bigint): string {
  const num = typeof value === "bigint" ? Number(value) / 1e18 : value;
  if (num === 0) return "0 ETH";
  if (num < 0.0001) return `${num.toFixed(8)} ETH`;
  if (num < 0.01) return `${num.toFixed(6)} ETH`;
  if (num < 1) return `${num.toFixed(4)} ETH`;
  return `${num.toFixed(2)} ETH`;
}

/** Migration % — more decimals when progress is tiny. */
export function formatMigrationPercent(bps: number): string {
  const pct = bps / 100;
  if (pct > 0 && pct < 0.1) return `${pct.toFixed(3)}%`;
  if (pct < 1) return `${pct.toFixed(2)}%`;
  return `${pct.toFixed(1)}%`;
}

export function formatPercent(bps: number) {
  return `${(bps / 100).toFixed(1)}%`;
}

export function truncateAddress(address: string, chars = 4) {
  return `${address.slice(0, 6 + chars)}...${address.slice(-4 - chars)}`;
}

export function hasBa5eSuffix(address: string) {
  return address.toLowerCase().endsWith("ba5e");
}

/** @deprecated use hasBa5eSuffix */
export const hasPpppSuffix = hasBa5eSuffix;

export function formatCountdown(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function displayAddress(address: string) {
  const lower = address.toLowerCase();
  if (lower.endsWith("ba5e")) {
    const prefix = address.slice(0, -4);
    return { prefix, suffix: "ba5e", hexSuffix: address.slice(-4) };
  }
  return { prefix: truncateAddress(address), suffix: null, hexSuffix: null };
}
