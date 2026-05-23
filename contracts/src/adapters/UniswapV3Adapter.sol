// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PolyfunConstants} from "../PolyfunConstants.sol";
import {
    IWETH,
    IUniswapV3Factory,
    IUniswapV3Pool,
    INonfungiblePositionManager,
    IMigrationAdapter
} from "../interfaces/IPolyfun.sol";

interface IUniswapV3PoolInitialize {
    function initialize(uint160 sqrtPriceX96) external;
}

interface PolyfunTokenLike {
    function approve(address spender, uint256 amount) external returns (bool);
}

contract UniswapV3Adapter is IMigrationAdapter {
    IUniswapV3Factory public immutable factory;
    INonfungiblePositionManager public immutable nfpm;
    IWETH public immutable weth;

    constructor(address _factory, address _nfpm, address _weth) {
        factory = IUniswapV3Factory(_factory);
        nfpm = INonfungiblePositionManager(_nfpm);
        weth = IWETH(_weth);
    }

    function migrate(
        address token,
        uint256 tokenAmount,
        uint256 ethAmount
    ) external payable returns (address pool) {
        require(msg.value == ethAmount, "ETH");
        require(tokenAmount > 0 && ethAmount > 0, "ZeroLiquidity");

        weth.deposit{value: ethAmount}();

        address token0 = token < address(weth) ? token : address(weth);
        address token1 = token < address(weth) ? address(weth) : token;

        uint256 amount0 = token0 == token ? tokenAmount : ethAmount;
        uint256 amount1 = token1 == token ? tokenAmount : ethAmount;

        pool = factory.getPool(token0, token1, PolyfunConstants.V3_FEE_TIER);
        if (pool == address(0)) {
            pool = factory.createPool(token0, token1, PolyfunConstants.V3_FEE_TIER);
            uint160 sqrtPriceX96 = _encodePriceSqrt(amount1, amount0);
            IUniswapV3PoolInitialize(pool).initialize(sqrtPriceX96);
        }

        PolyfunTokenLike(token).approve(address(nfpm), tokenAmount);
        weth.approve(address(nfpm), ethAmount);

        (, int24 currentTick,,,,,) = IUniswapV3Pool(pool).slot0();
        int24 spacing = PolyfunConstants.V3_TICK_SPACING;
        int24 half = PolyfunConstants.V3_TICK_RANGE_WIDTH / 2;
        int24 tickLower = _alignTick(currentTick - half, spacing);
        int24 tickUpper = _alignTick(currentTick + half, spacing);
        if (tickLower >= tickUpper) {
            tickUpper = tickLower + spacing;
        }

        nfpm.mint(
            INonfungiblePositionManager.MintParams({
                token0: token0,
                token1: token1,
                fee: PolyfunConstants.V3_FEE_TIER,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: amount0,
                amount1Desired: amount1,
                amount0Min: 0,
                amount1Min: 0,
                recipient: PolyfunConstants.DEAD,
                deadline: block.timestamp
            })
        );
    }

    function _alignTick(int24 tick, int24 spacing) internal pure returns (int24) {
        int24 r = tick % spacing;
        if (r == 0) return tick;
        if (tick < 0) return tick - r - spacing;
        return tick - r;
    }

    function _encodePriceSqrt(uint256 amount1, uint256 amount0) internal pure returns (uint160) {
        require(amount0 > 0 && amount1 > 0, "Price");
        uint256 ratioX192 = (amount1 << 192) / amount0;
        uint256 sqrtRatio = _sqrt(ratioX192);
        if (sqrtRatio >> 160 != 0) revert("PriceOverflow");
        return uint160(sqrtRatio);
    }

    function _sqrt(uint256 x) internal pure returns (uint256 z) {
        if (x == 0) return 0;
        z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
}
