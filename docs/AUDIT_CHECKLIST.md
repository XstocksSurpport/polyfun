# Polyfun pre-mainnet audit checklist

Last updated: 2026-05-23

## CREATE2 / ba5e

- [x] `PolyfunConstants.BA5E_SUFFIX == 0xBA5E` (2-byte tail → hex suffix `…ba5e`)
- [x] `finalSalt = keccak256(abi.encodePacked(creator, rawSalt))` — MEV bots cannot reuse stolen salt
- [x] `createLaunch` reverts with `SuffixMismatch` if token lacks suffix
- [x] Frontend/API grind `predictTokenAddress(creator, rawSalt)` against launcher clone hash
- [ ] Run `npm run deploy:mainnet` then `npm run deploy:platform` on Base mainnet

## Base mainnet addresses (chainId 8453)

| Contract | Address |
|----------|---------|
| WETH | `0x4200000000000000000000000000000000000006` |
| Uniswap V3 Factory | `0x33128a8fC17869897dcE68Ed026d694621f6FDfD` |
| NFPM | `0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1` |

Deploy script reads `PolyfunChainConfig.getDex(chainId)` — **not** hardcoded runtime adapter from `PolyfunConstants.V3_*`.

## Migration (YES win)

- [x] Trigger: YES ≥ 4 ETH net **and** ≥ 90% pool ratio (same tx)
- [x] `transferForLp` sends 200M tokens to adapter before `migrate`
- [x] All market ETH (YES + NO) minus 0.1 ETH migration fee → Uniswap LP
- [x] NFPM position → `DEAD` (LP locked)
- [x] Trigger buyer auto-receives YES claim in same tx after `enableTransfers`
- [ ] Fork test on Base mainnet before live deploy

## Settlement (NO win)

- [x] 2% of balance → `FEE_RECEIVER` (`0xFDC18444eca2FEfd44fA7516Ff994aAfC17C4fD5`)
- [x] Remainder pro-rata to NO depositors via `claimNoPayout`

## Launcher

- [x] `msg.value == DEPLOY_FEE` (exact, no trapped ETH)
- [x] `defaultDuration == 2 days` (48 hours)

## Frontend (post-deploy)

- [ ] Set `app/.env.local`: `NEXT_PUBLIC_LAUNCHER_ADDRESS`, `NEXT_PUBLIC_REGISTRY_ADDRESS`, `NEXT_PUBLIC_POLYFUN_ADDRESS`, `NEXT_PUBLIC_CHAIN_ID=8453`
- [ ] Market page: progress bar from `yesValue` / 4 ETH; Uniswap link after migrate
- [ ] Production build: no browser source maps (`productionBrowserSourceMaps: false`)

## Deploy command (mainnet — requires funded key)

```bash
# contracts/.env: PRIVATE_KEY=...
npm run deploy:mainnet
npm run deploy:platform
```

**Do not deploy until fork tests pass and key is secured.**
