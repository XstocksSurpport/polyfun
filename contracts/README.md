# Polyfun Contracts

Foundry project for **Base Mainnet (8453)** and **Base Sepolia (84532)**.

## Build & test

```bash
cd contracts
forge build
forge test
```

## Deploy Base Sepolia

```bash
cp .env.example .env
# Edit PRIVATE_KEY (deployer with Sepolia ETH)

# From repo root:
npm run deploy:sepolia
```

Or manually:

```bash
forge script script/Deploy.s.sol:DeployPolyfun \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  --verify --etherscan-api-key $BASESCAN_API_KEY
```

Addresses are written to `../deployments/base-sepolia.json` and synced into `app/.env.local`.

## Chain DEX addresses

| Network | V3 Factory | NFPM |
|---------|------------|------|
| Base | `0x33128a8f…` | `0x03A520B3…` |
| Base Sepolia | `0x4752ba5D…` | `0x27F971cb…` |

Source of truth: `deploy/addresses.json` + `PolyfunChainConfig.sol`.

## Layout

See [DEVELOPMENT.md §6.2](../docs/DEVELOPMENT.md) and repo `src/`.

## MVP gaps

- Full bonding curve (non-linear pricing)
- `PolyfunConfig` governance
- Aerodrome + ExternalOption modules
- Fork tests against live Sepolia NFPM
