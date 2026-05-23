# Polyfun

**Prediction Launchpad on Base** — Pump.fun-style launches with Polymarket YES/NO markets.

| Doc | [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) (v0.7.0) |
|-----|--------------------------------------------------------|

## Quick start

```bash
# 1. Frontend
npm run install:app
npm run dev          # http://localhost:3000

# 2. Contracts (local)
npm run contracts:build
npm run contracts:test

# 3. Deploy Base Sepolia
cp contracts/.env.example contracts/.env   # set PRIVATE_KEY
npm run deploy:sepolia

# 4. Vanity worker (required for /launch pppp salt)
npm run vanity:install
# set LAUNCHER_ADDRESS in vanity/.env from deployments/base-sepolia.json
npm run vanity       # http://localhost:8787
```

After deploy, `app/.env.local` is auto-updated with launcher + registry addresses.

## Repo layout

```
polyfun/
├── app/                 Next.js frontend
├── contracts/           Foundry — Launcher, Market, Token, V3 adapter
├── vanity/              CREATE2 pppp salt grinder (Node + viem)
├── deploy/              Chain DEX address book (JSON)
├── deployments/         Generated deploy artifacts (gitignored secrets)
└── docs/DEVELOPMENT.md  Full spec
```

## Contracts (implemented)

| Contract | Role |
|----------|------|
| `PolyfunLauncher` | `createLaunch`, CREATE2 `0x70707070` suffix |
| `PolyfunMarket` | `buyYes` / `buyNo`, migrate, `settleNo` |
| `PolyfunToken` | Locked until migration + Launch Protection |
| `UniswapV3Adapter` | Narrow CL LP → `0xdead` |
| `BondingCurve` | Quote library (MVP 1:1 net ETH → shares) |

Fees → `0xFDC18444eca2FEfd44fA7516Ff994aAfC17C4fD5`

## Phase 2 (documented, not yet shipped)

- `POLYFUN.sol`, `PolyfunConfig`, Aerodrome adapter
- `PolyfunExternalOption` (frontend panel stub exists)
- Indexer / Postgres

## License

TBD
