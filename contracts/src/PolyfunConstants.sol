// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library PolyfunConstants {
    address internal constant FEE_RECEIVER = 0xFDC18444eca2FEfd44fA7516Ff994aAfC17C4fD5;

    uint256 internal constant TOTAL_SUPPLY = 1_000_000_000 ether;
    uint256 internal constant INTERNAL_POOL_SUPPLY = 800_000_000 ether;
    uint256 internal constant EXTERNAL_LP_SUPPLY = 200_000_000 ether;

    uint256 internal constant TRANSITION_THRESHOLD_ETH = 4 ether;
    uint16 internal constant THRESHOLD_BPS = 9000;

    uint256 internal constant DEPLOY_FEE = 0.0005 ether;
    uint16 internal constant TRADING_FEE_BPS = 100;
    uint256 internal constant MIGRATION_FEE = 0.1 ether;
    uint16 internal constant SETTLEMENT_FEE_BPS = 200;

    uint32 internal constant PPPP_SUFFIX = 0x70707070;

    address internal constant WETH = 0x4200000000000000000000000000000000000006;
    address internal constant V3_FACTORY = 0x33128a8fC17869897dcE68Ed026d694621f6FDfD;
    address internal constant V3_NFPM = 0x03A520B32C04bF3bEE4386502744716d2F6b9D3e;
    address internal constant DEAD = 0x000000000000000000000000000000000000dEaD;

    uint24 internal constant V3_FEE_TIER = 10000;
    int24 internal constant V3_TICK_SPACING = 200;
    int24 internal constant V3_TICK_RANGE_WIDTH = 2000;

    function hasPpppSuffix(address token) internal pure returns (bool) {
        return uint32(uint160(token)) == PPPP_SUFFIX;
    }
}
