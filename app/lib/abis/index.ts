export const launcherAbi = [
  {
    type: "event",
    name: "LaunchCreated",
    inputs: [
      { name: "market", type: "address", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "salt", type: "bytes32", indexed: false },
    ],
  },
  {
    type: "function",
    name: "quoteCreationFee",
    stateMutability: "view",
    inputs: [{ name: "burnPolyfun", type: "bool" }],
    outputs: [{ name: "fee", type: "uint256" }],
  },
  {
    type: "function",
    name: "predictTokenAddress",
    stateMutability: "view",
    inputs: [{ name: "salt", type: "bytes32" }],
    outputs: [{ name: "token", type: "address" }],
  },
  {
    type: "function",
    name: "createLaunch",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "metadataHash", type: "bytes32" },
          { name: "initialLiquidity", type: "uint256" },
          { name: "burnPolyfun", type: "bool" },
        ],
      },
      { name: "salt", type: "bytes32" },
    ],
    outputs: [
      { name: "market", type: "address" },
      { name: "token", type: "address" },
    ],
  },
] as const;

export const registryAbi = [
  {
    type: "function",
    name: "isOfficialMarket",
    stateMutability: "view",
    inputs: [{ name: "market", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "markets",
    stateMutability: "view",
    inputs: [{ name: "market", type: "address" }],
    outputs: [
      { name: "market", type: "address" },
      { name: "token", type: "address" },
      { name: "creator", type: "address" },
      { name: "metadataHash", type: "bytes32" },
      { name: "createdAt", type: "uint256" },
      { name: "isOfficial", type: "bool" },
    ],
  },
] as const;

export const marketAbi = [
  {
    type: "event",
    name: "YesPurchased",
    inputs: [
      { name: "buyer", type: "address", indexed: true },
      { name: "amountIn", type: "uint256", indexed: false },
      { name: "sharesOut", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "NoPurchased",
    inputs: [
      { name: "buyer", type: "address", indexed: true },
      { name: "amountIn", type: "uint256", indexed: false },
      { name: "sharesOut", type: "uint256", indexed: false },
    ],
  },
  {
    type: "function",
    name: "buyYes",
    stateMutability: "payable",
    inputs: [
      { name: "minSharesOut", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "buyNo",
    stateMutability: "payable",
    inputs: [
      { name: "minSharesOut", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "yesValue",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "noValue",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "thresholdBps",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint16" }],
  },
  {
    type: "function",
    name: "expiry",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "status",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "token",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "creator",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "externalPool",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "migrationAdapter",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "settleNo",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "claimYesTokens",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "claimNoPayout",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "totalYesShares",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "yesShares",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "noShares",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "quoteBuyYes",
    stateMutability: "view",
    inputs: [{ name: "amountIn", type: "uint256" }],
    outputs: [
      { name: "sharesOut", type: "uint256" },
      { name: "newYesRatioBps", type: "uint256" },
      { name: "willTrigger", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "quoteBuyNo",
    stateMutability: "view",
    inputs: [{ name: "amountIn", type: "uint256" }],
    outputs: [
      { name: "sharesOut", type: "uint256" },
      { name: "newYesRatioBps", type: "uint256" },
      { name: "willTrigger", type: "bool" },
    ],
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "launchBlock",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
