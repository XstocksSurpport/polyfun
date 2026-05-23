import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEth(value: number | bigint, digits = 4) {
  const num = typeof value === "bigint" ? Number(value) / 1e18 : value;
  return `${num.toFixed(digits)} ETH`;
}

export function formatPercent(bps: number) {
  return `${(bps / 100).toFixed(1)}%`;
}

export function truncateAddress(address: string, chars = 4) {
  return `${address.slice(0, 6 + chars)}...${address.slice(-4 - chars)}`;
}

export function hasPpppSuffix(address: string) {
  return address.toLowerCase().endsWith("70707070");
}

export function formatCountdown(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function displayAddress(address: string) {
  const lower = address.toLowerCase();
  if (lower.endsWith("70707070")) {
    const prefix = address.slice(0, -8);
    return { prefix, suffix: "pppp", hexSuffix: address.slice(-8) };
  }
  return { prefix: truncateAddress(address), suffix: null, hexSuffix: null };
}
