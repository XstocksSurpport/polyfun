import chainAddresses from "./chain-addresses.json";

export type ChainAddresses = {
  name: string;
  weth: `0x${string}`;
  uniswapV3: {
    factory: `0x${string}`;
    nfpm: `0x${string}`;
  };
};

export function getChainAddresses(chainId: number): ChainAddresses | undefined {
  return chainAddresses[String(chainId) as keyof typeof chainAddresses] as
    | ChainAddresses
    | undefined;
}
