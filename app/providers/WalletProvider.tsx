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
  getProviders: () => Eip6963ProviderDetail[];
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

async function bindProvider(eip1193: Eip1193Provider) {
  await ensureChain(eip1193);
  const browserProvider = new BrowserProvider(eip1193, CHAIN_ID);
  await browserProvider.send("eth_requestAccounts", []);
  const network = await browserProvider.getNetwork();
  const signer = await browserProvider.getSigner();
  const address = await signer.getAddress();
  return { signer, address, chainId: Number(network.chainId) };
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [connecting, setConnecting] = useState(false);
  const providersRef = useRef<Eip6963ProviderDetail[]>([]);
  const wcProviderRef = useRef<{ disconnect: () => Promise<void> } | null>(null);

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

  const getProviders = useCallback(() => providersRef.current, []);

  const connectInjected = useCallback(async (detail: Eip6963ProviderDetail) => {
    setConnecting(true);
    try {
      const bound = await bindProvider(detail.provider);
      setSigner(bound.signer);
      setAddress(bound.address);
      setChainId(bound.chainId);
    } finally {
      setConnecting(false);
    }
  }, []);

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
      const bound = await bindProvider(provider as unknown as Eip1193Provider);
      setSigner(bound.signer);
      setAddress(bound.address);
      setChainId(bound.chainId);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (wcProviderRef.current) {
      await wcProviderRef.current.disconnect();
      wcProviderRef.current = null;
    }
    setSigner(null);
    setAddress(null);
    setChainId(null);
  }, []);

  const value = useMemo(
    () => ({
      address,
      chainId,
      signer,
      connecting,
      getProviders,
      connectInjected,
      connectWalletConnect,
      disconnect,
    }),
    [address, chainId, signer, connecting, getProviders, connectInjected, connectWalletConnect, disconnect]
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
