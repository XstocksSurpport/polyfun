# Polyfun

**The Prediction-Driven Launchpad** on Base — Pump.fun-style launches with Polymarket YES/NO markets.

**Website:** [polyfun.wtf](https://polyfun.wtf) · **X:** [@polyfun_wtf](https://x.com/polyfun_wtf)

| Doc | [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) (v0.7.0) |
|-----|--------------------------------------------------------|

## Quick start

```bash
# 1. Frontend
npm run install:app
npm run dev          # http://localhost:3001

# 2. Contracts (local)
npm run contracts:build
npm run contracts:test

# 3. Deploy Base Sepolia
cp contracts/.env.example contracts/.env   # set PRIVATE_KEY
npm run deploy:sepolia

# 4. Optional vanity worker (legacy HTTP API; /launch grinds ba5e in-browser)
npm run vanity:install
# set LAUNCHER_ADDRESS in vanity/.env from deployments/base-sepolia.json
npm run vanity       # http://localhost:8787
```

After deploy, `app/.env.local` is auto-updated with launcher + registry addresses.

## Deploy to Vercel

The Next.js app lives in **`app/`** (not the repo root). In Vercel:

1. **Project → Settings → General → Root Directory** → set to **`app`** → Save  
2. **Build Command** → leave **empty** (default `next build`)  
3. **Install Command** → leave **empty** (default `npm install`)  
4. **Environment Variables** → copy from `app/.env.local.example` (use production Base mainnet values). Set `NEXT_PUBLIC_SITE_URL=https://polyfun.wtf` and `NEXT_PUBLIC_X_URL=https://x.com/polyfun_wtf`.
5. Redeploy

If Root Directory is left at the repo root, the build runs `next` where it is not installed (`next: command not found`).

## Repo layout

```
polyfun/
├── app/                 Next.js frontend
├── contracts/           Foundry — Launcher, Market, Token, V3 adapter
├── vanity/              CREATE2 ba5e salt grinder (Node + viem)
├── deploy/              Chain DEX address book (JSON)
├── deployments/         Generated deploy artifacts (gitignored secrets)
└── docs/DEVELOPMENT.md  Full spec
```

## Contracts (implemented)

| Contract | Role |
|----------|------|
| `PolyfunLauncher` | `createLaunch`, CREATE2 `…ba5e` suffix + sender-bound salt |
| `PolyfunMarket` | `buyYes` / `buyNo`, migrate, `settleNo` |
| `PolyfunToken` | Locked until migration + Launch Protection |
| `UniswapV3Adapter` | Narrow CL LP → `0xdead` |
| `BondingCurve` | Quote library (MVP 1:1 net ETH → shares) |

Fees → `0xFDC18444eca2FEfd44fA7516Ff994aAfC17C4fD5`

### Mainnet hotfix (clone reentrancy guard)

Markets deployed before this fix cannot trade (`Reentrancy` revert). Redeploy launcher + platform market:

```bash
cp contracts/.env.example contracts/.env   # PRIVATE_KEY + BASE_RPC_URL
npm run deploy:launcher-v3
FORCE_PLATFORM=1 npm run bootstrap:platform
```

Update Vercel env: `NEXT_PUBLIC_LAUNCHER_ADDRESS`, `NEXT_PUBLIC_REGISTRY_ADDRESS`, `NEXT_PUBLIC_PLATFORM_MARKET_ADDRESS`, `NEXT_PUBLIC_PLATFORM_TOKEN_ADDRESS`.

## Phase 2 (documented, not yet shipped)

- `POLYFUN.sol`, `PolyfunConfig`, Aerodrome adapter
- `PolyfunExternalOption` (frontend panel stub exists)
- Indexer / Postgres

## License

TBD
