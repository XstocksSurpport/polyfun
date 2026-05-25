import { contracts, SITE_URL, socialLinks } from "./config";

export function getPlatformMarketAddress() {
  return contracts.platformMarket;
}

export function isPlatformMarket(address: string | undefined | null): boolean {
  if (!address || !contracts.platformMarket) return false;
  return address.toLowerCase() === contracts.platformMarket.toLowerCase();
}

/** Official $poly links on platform market surfaces. */
export function resolveMarketSocialLinks(market: {
  address: string;
  twitter?: string;
  telegram?: string;
  website?: string;
}) {
  if (!isPlatformMarket(market.address)) {
    return {
      twitter: market.twitter,
      telegram: market.telegram,
      website: market.website,
    };
  }

  return {
    twitter: market.twitter?.trim() || socialLinks.x,
    telegram: market.telegram?.trim() || socialLinks.telegram || undefined,
    website: market.website?.trim() || SITE_URL,
  };
}
