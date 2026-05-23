// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Per-chain DEX addresses for deploy scripts (see deploy/addresses.json).
library PolyfunChainConfig {
    error UnsupportedChain(uint256 chainId);

    struct DexAddresses {
        address weth;
        address v3Factory;
        address v3Nfpm;
    }

    function getDex(uint256 chainId) internal pure returns (DexAddresses memory dex) {
        if (chainId == 8453) {
            return DexAddresses({
                weth: 0x4200000000000000000000000000000000000006,
                v3Factory: 0x33128a8fC17869897dcE68Ed026d694621f6FDfD,
                v3Nfpm: 0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1
            });
        }
        if (chainId == 84532) {
            return DexAddresses({
                weth: 0x4200000000000000000000000000000000000006,
                v3Factory: 0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24,
                v3Nfpm: 0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2
            });
        }
        revert UnsupportedChain(chainId);
    }
}
