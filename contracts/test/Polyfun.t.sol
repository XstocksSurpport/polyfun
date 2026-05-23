// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PolyfunConstants} from "../src/PolyfunConstants.sol";
import {PolyfunToken} from "../src/PolyfunToken.sol";
import {PolyfunMarket} from "../src/PolyfunMarket.sol";
import {PolyfunRegistry} from "../src/PolyfunRegistry.sol";
import {PolyfunLauncher} from "../src/PolyfunLauncher.sol";
import {UniswapV3Adapter} from "../src/adapters/UniswapV3Adapter.sol";

contract PolyfunConstantsTest is Test {
    function test_ppppSuffixCheck() public pure {
        address token = address(uint160(PolyfunConstants.PPPP_SUFFIX));
        assertTrue(PolyfunConstants.hasPpppSuffix(token));
    }

    function test_settlementFeeBps() public pure {
        assertEq(PolyfunConstants.SETTLEMENT_FEE_BPS, 200);
    }
}

contract PolyfunLauncherTest is Test {
    PolyfunLauncher launcher;
    PolyfunRegistry registry;

    function setUp() public {
        registry = new PolyfunRegistry();
        address tokenImpl = address(new PolyfunToken());
        address marketImpl = address(new PolyfunMarket());
        address adapter = address(
            new UniswapV3Adapter(
                PolyfunConstants.V3_FACTORY,
                PolyfunConstants.V3_NFPM,
                PolyfunConstants.WETH
            )
        );
        launcher = new PolyfunLauncher(
            address(registry),
            tokenImpl,
            marketImpl,
            adapter
        );
    }

    function test_quoteCreationFee() public view {
        assertEq(launcher.quoteCreationFee(false), PolyfunConstants.DEPLOY_FEE);
    }

    function test_predictTokenAddress_deterministic() public view {
        bytes32 salt = keccak256("test-salt");
        address a = launcher.predictTokenAddress(salt);
        address b = launcher.predictTokenAddress(salt);
        assertEq(a, b);
    }
}
