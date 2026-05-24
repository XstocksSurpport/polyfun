export const WALLET_STORAGE_KEY = "polyfun_wallet_v1";

export type StoredWallet =
  | { type: "injected"; rdns: string; uuid: string }
  | { type: "walletconnect" };

export function readStoredWallet(): StoredWallet | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(WALLET_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredWallet;
  } catch {
    return null;
  }
}

export function writeStoredWallet(wallet: StoredWallet | null) {
  if (typeof window === "undefined") return;
  if (!wallet) {
    sessionStorage.removeItem(WALLET_STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
}
