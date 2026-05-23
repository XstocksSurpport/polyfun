# Polyfun pre-mainnet audit checklist

Last updated: 2026-05-23

## CREATE2 / pppp

- [x] `PolyfunConstants.PPPP_SUFFIX == 0x70707070` (4-byte tail, not `0x7070`)
- [x] `createLaunch` reverts with `SuffixMismatch` if token lacks suffix
- [x] Vanity worker grinds salt against `predictTokenAddress(salt)` on launcher
- [ ] Run `npm run vanity` before each mainnet launch batch

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
- [x] `defaultDuration == 1 days`

## Frontend (post-deploy)

- [ ] Set `app/.env.local`: `NEXT_PUBLIC_LAUNCHER_ADDRESS`, `NEXT_PUBLIC_REGISTRY_ADDRESS`, `NEXT_PUBLIC_CHAIN_ID=8453`
- [ ] Market page: progress bar from `yesValue` / 4 ETH; Uniswap link after migrate
- [ ] Production build: no browser source maps (`productionBrowserSourceMaps: false`)

## Deploy command (mainnet — requires funded key)

```bash
# contracts/.env: PRIVATE_KEY=...
forge script script/Deploy.s.sol --rpc-url https://mainnet.base.org --broadcast
```

**Do not deploy until fork tests pass and key is secured.**
