"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { CHAIN_ID, rpcUrl, walletConnectProjectId, chainParams } from "@/lib/config";
import { readStoredWallet, writeStoredWallet } from "@/lib/wallet-storage";

export interface Eip6963ProviderDetail {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: Eip1193Provider;
}

interface WalletContextValue {
  address: string | null;
  chainId: number | null;
  signer: JsonRpcSigner | null;
  connecting: boolean;
  restoring: boolean;
  getProviders: () => Eip6963ProviderDetail[];
  getSigner: () => Promise<JsonRpcSigner>;
  connectInjected: (detail: Eip6963ProviderDetail) => Promise<void>;
  connectWalletConnect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

async function ensureChain(eip1193: Eip1193Provider) {
  const currentChain = (await eip1193.request({ method: "eth_chainId" })) as string;
  if (parseInt(currentChain, 16) === CHAIN_ID) return;

  try {
    await eip1193.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainParams.chainId }],
    });
  } catch (error) {
    const code = (error as { code?: number })?.code;
    if (code !== 4902) throw error;
    await eip1193.request({
      method: "wallet_addEthereumChain",
      params: [chainParams],
    });
  }
}

async function bindProvider(eip1193: Eip1193Provider, requestAccounts: boolean) {
  await ensureChain(eip1193);
  const browserProvider = new BrowserProvider(eip1193, CHAIN_ID);
  if (requestAccounts) {
    await browserProvider.send("eth_requestAccounts", []);
  }
  const accounts = (await browserProvider.send("eth_accounts", [])) as string[];
  if (!accounts.length) {
    throw new Error("NO_ACCOUNTS");
  }
  const network = await browserProvider.getNetwork();
  const signer = await browserProvider.getSigner();
  const address = await signer.getAddress();
  return { signer, address, chainId: Number(network.chainId), eip1193 };
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const providersRef = useRef<Eip6963ProviderDetail[]>([]);
  const activeProviderRef = useRef<Eip1193Provider | null>(null);
  const wcProviderRef = useRef<{ disconnect: () => Promise<void> } | null>(null);
  const restoreStartedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const discovered = new Map<string, Eip6963ProviderDetail>();

    const push = (detail: Eip6963ProviderDetail) => {
      const key = detail.info.rdns || detail.info.name.toLowerCase();
      if (!discovered.has(key)) discovered.set(key, detail);
    };

    const sync = () => {
      providersRef.current = Array.from(discovered.values());
    };

    const onAnnounce = (event: Event) => {
      push((event as CustomEvent<Eip6963ProviderDetail>).detail);
      sync();
    };

    window.addEventListener("eip6963:announceProvider", onAnnounce as EventListener);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    const fallbackTimer = window.setTimeout(() => {
      if (discovered.size > 0 || !window.ethereum) return;
      push({
        info: {
          uuid: "injected-fallback",
          name: "Browser Wallet",
          icon: "",
          rdns: "injected",
        },
        provider: window.ethereum!,
      });
      sync();
    }, 300);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("eip6963:announceProvider", onAnnounce as EventListener);
    };
  }, []);

  const applySession = useCallback(
    (bound: { signer: JsonRpcSigner; address: string; chainId: number }, eip1193: Eip1193Provider) => {
      activeProviderRef.current = eip1193;
      setSigner(bound.signer);
      setAddress(bound.address);
      setChainId(bound.chainId);
    },
    []
  );

  const clearSession = useCallback(() => {
    activeProviderRef.current = null;
    setSigner(null);
    setAddress(null);
    setChainId(null);
    writeStoredWallet(null);
  }, []);

  useEffect(() => {
    const eip1193 = activeProviderRef.current;
    if (!eip1193?.on) return;

    const onAccounts = async (accounts: unknown) => {
      const list = accounts as string[];
      if (!list?.length) {
        clearSession();
        return;
      }
      try {
        const bound = await bindProvider(eip1193, false);
        applySession(bound, bound.eip1193);
      } catch {
        clearSession();
      }
    };

    const onChain = async () => {
      try {
        const bound = await bindProvider(eip1193, false);
        applySession(bound, bound.eip1193);
      } catch {
        setChainId(null);
      }
    };

    eip1193.on("accountsChanged", onAccounts);
    eip1193.on("chainChanged", onChain);
    return () => {
      eip1193.removeListener?.("accountsChanged", onAccounts);
      eip1193.removeListener?.("chainChanged", onChain);
    };
  }, [address, applySession, clearSession]);

  useEffect(() => {
    if (restoreStartedRef.current) return;
    restoreStartedRef.current = true;

    const restore = async () => {
      const stored = readStoredWallet();
      if (!stored) return;

      setRestoring(true);

      const waitForProviders = async (maxMs = 1200) => {
        const start = Date.now();
        while (Date.now() - start < maxMs) {
          if (providersRef.current.length > 0) return true;
          if (window.ethereum) {
            providersRef.current = [
              {
                info: {
                  uuid: "injected-fallback",
                  name: "Browser Wallet",
                  icon: "",
                  rdns: "injected",
                },
                provider: window.ethereum,
              },
            ];
            return true;
          }
          await new Promise((r) => setTimeout(r, 50));
        }
        return false;
      };

      try {
        if (stored.type === "injected") {
          const ready = await waitForProviders();
          if (!ready) return;

          const detail = providersRef.current.find(
            (p) => p.info.uuid === stored.uuid || p.info.rdns === stored.rdns
          );
          if (!detail) return;

          const bound = await bindProvider(detail.provider, false);
          applySession(bound, bound.eip1193);
        } else if (stored.type === "walletconnect" && walletConnectProjectId) {
          const { default: EthereumProvider } = await import("@walletconnect/ethereum-provider");
          const provider = await EthereumProvider.init({
            projectId: walletConnectProjectId,
            chains: [CHAIN_ID],
            optionalChains: [CHAIN_ID],
            showQrModal: false,
            rpcMap: { [CHAIN_ID]: rpcUrl },
          });
          const accounts = (await provider.enable()) as string[];
          if (accounts.length) {
            wcProviderRef.current = provider;
            const bound = await bindProvider(provider as unknown as Eip1193Provider, false);
            applySession(bound, bound.eip1193);
          }
        }
      } catch {
        writeStoredWallet(null);
      } finally {
        setRestoring(false);
      }
    };

    restore();
  }, [applySession]);

  const getProviders = useCallback(() => providersRef.current, []);

  const getSigner = useCallback(async () => {
    const eip1193 = activeProviderRef.current;
    if (!eip1193) throw new Error("Connect your wallet first");
    await ensureChain(eip1193);
    const browserProvider = new BrowserProvider(eip1193, CHAIN_ID);
    const nextSigner = await browserProvider.getSigner();
    const nextAddress = await nextSigner.getAddress();
    setSigner(nextSigner);
    setAddress(nextAddress);
    return nextSigner;
  }, []);

  const connectInjected = useCallback(
    async (detail: Eip6963ProviderDetail) => {
      setConnecting(true);
      try {
        const bound = await bindProvider(detail.provider, true);
        applySession(bound, bound.eip1193);
        writeStoredWallet({
          type: "injected",
          rdns: detail.info.rdns,
          uuid: detail.info.uuid,
        });
      } finally {
        setConnecting(false);
      }
    },
    [applySession]
  );

  const connectWalletConnect = useCallback(async () => {
    if (!walletConnectProjectId) return;
    setConnecting(true);
    try {
      const { default: EthereumProvider } = await import("@walletconnect/ethereum-provider");
      const provider = await EthereumProvider.init({
        projectId: walletConnectProjectId,
        chains: [CHAIN_ID],
        optionalChains: [CHAIN_ID],
        showQrModal: true,
        rpcMap: { [CHAIN_ID]: rpcUrl },
      });
      await provider.enable();
      wcProviderRef.current = provider;
      const bound = await bindProvider(provider as unknown as Eip1193Provider, false);
      applySession(bound, bound.eip1193);
      writeStoredWallet({ type: "walletconnect" });
    } finally {
      setConnecting(false);
    }
  }, [applySession]);

  const disconnect = useCallback(async () => {
    if (wcProviderRef.current) {
      await wcProviderRef.current.disconnect();
      wcProviderRef.current = null;
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      address,
      chainId,
      signer,
      connecting,
      restoring,
      getProviders,
      getSigner,
      connectInjected,
      connectWalletConnect,
      disconnect,
    }),
    [
      address,
      chainId,
      signer,
      connecting,
      restoring,
      getProviders,
      getSigner,
      connectInjected,
      connectWalletConnect,
      disconnect,
    ]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }

  interface Eip1193Provider {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on?: (event: string, handler: (...args: unknown[]) => void) => void;
    removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  }
}
