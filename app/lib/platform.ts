import { contracts } from "./config";

export function getPlatformMarketAddress() {
  return contracts.platformMarket;
}

export function isPlatformMarket(address: string | undefined | null): boolean {
  if (!address || !contracts.platformMarket) return false;
  return address.toLowerCase() === contracts.platformMarket.toLowerCase();
}
