// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PolyfunConstants} from "../src/PolyfunConstants.sol";
import {PolyfunToken} from "../src/PolyfunToken.sol";
import {PolyfunMarket} from "../src/PolyfunMarket.sol";
import {PolyfunRegistry} from "../src/PolyfunRegistry.sol";
import {PolyfunLauncher} from "../src/PolyfunLauncher.sol";
import {IMigrationAdapter} from "../src/interfaces/IPolyfun.sol";

contract MockMigrationAdapter is IMigrationAdapter {
    uint256 public lastEth;
    uint256 public lastTokenAmount;
    address public lastToken;

    function migrate(
        address token,
        uint256 tokenAmount,
        uint256 ethAmount
    ) external payable returns (address pool) {
        require(msg.value == ethAmount, "ETH");
        require(PolyfunToken(token).balanceOf(address(this)) >= tokenAmount, "NeedTokens");
        lastToken = token;
        lastTokenAmount = tokenAmount;
        lastEth = ethAmount;
        return address(0xBEEF);
    }
}

import {Create2Deployer} from "../src/lib/Create2Deployer.sol";

contract MigrationTest is Test {
    address feeReceiver = PolyfunConstants.FEE_RECEIVER;
    address buyer = address(0xB0B);
    address noBuyer = address(0x1001);

    PolyfunMarket market;
    PolyfunToken token;
    MockMigrationAdapter adapter;

    function setUp() public {
        token = new PolyfunToken();
        market = new PolyfunMarket();
        adapter = new MockMigrationAdapter();
        token.initialize("Test", "TST", address(market));
        market.initialize(
            address(this),
            address(token),
            address(this),
            PolyfunConstants.THRESHOLD_BPS,
            1 days,
            address(adapter)
        );
    }

    function test_settleNo_sends2PercentFee() public {
        vm.deal(buyer, 2 ether);
        vm.prank(buyer);
        market.buyYes{value: 0.5 ether}(0);

        vm.deal(noBuyer, 2 ether);
        vm.prank(noBuyer);
        market.buyNo{value: 0.5 ether}(0);

        vm.warp(block.timestamp + 2 days);

        uint256 feeBefore = feeReceiver.balance;
        uint256 poolBefore = address(market).balance;

        market.settleNo();

        uint256 feeDelta = feeReceiver.balance - feeBefore;
        assertEq(feeDelta, (poolBefore * 200) / 10_000);
        assertEq(market.noSettlementPool(), poolBefore - feeDelta);
    }

    function test_migration_sendsAllEthAndLpTokensToAdapter() public {
        vm.deal(buyer, 10 ether);
        vm.prank(buyer);
        // Gross > 4 ETH so net YES value clears 4 ETH after 1% trade fee
        market.buyYes{value: 4.05 ether}(0);

        assertEq(uint256(market.status()), uint256(PolyfunMarket.MarketStatus.Migrated));
        assertEq(address(market).balance, 0);
        assertEq(adapter.lastTokenAmount(), PolyfunConstants.EXTERNAL_LP_SUPPLY);
        assertTrue(token.transfersEnabled());
        assertEq(market.externalPool(), address(0xBEEF));
        assertTrue(token.balanceOf(buyer) > 0, "trigger buyer auto-claim");
    }

    function test_transferForLp_movesTokensWithoutUnlock() public {
        assertFalse(token.transfersEnabled());
        vm.prank(address(market));
        token.transferForLp(address(adapter), 1 ether);
        assertEq(token.balanceOf(address(adapter)), 1 ether);
    }

    function test_cloneTokenInitialize() public {
        address impl = address(new PolyfunToken());
        assertEq(PolyfunToken(impl).decimals(), 18);
        PolyfunToken(impl).initialize("T", "T", address(this));

        address clone = Create2Deployer.deployClone(keccak256("clone-test"), impl);
        assertEq(PolyfunToken(clone).decimals(), 18);
        PolyfunToken(clone).initialize("T", "T", address(this));
        assertEq(PolyfunToken(clone).symbol(), "T");
    }

    function test_createLaunch_fullWithBa5eSuffix() public {
        PolyfunRegistry registry = new PolyfunRegistry();
        address tokenImpl = address(new PolyfunToken());
        address marketImpl = address(new PolyfunMarket());
        PolyfunLauncher launcher = new PolyfunLauncher(
            address(registry),
            tokenImpl,
            marketImpl,
            address(adapter)
        );

        PolyfunLauncher.LaunchParams memory params = PolyfunLauncher.LaunchParams({
            name: "Test",
            symbol: "TST",
            metadataHash: bytes32(uint256(1)),
            initialLiquidity: 0,
            burnPolyfun: false
        });

        bytes32 rawSalt;
        address predicted;
        for (uint256 i = 0; i < 200_000; i++) {
            rawSalt = bytes32(i);
            predicted = launcher.predictTokenAddress(address(this), rawSalt);
            if (PolyfunConstants.hasBa5eSuffix(predicted)) break;
        }
        assertTrue(PolyfunConstants.hasBa5eSuffix(predicted), "ba5e salt not found");

        (address launchedMarket, address token) =
            launcher.createLaunch{value: PolyfunConstants.DEPLOY_FEE}(params, rawSalt);
        assertEq(token, predicted);
        assertTrue(registry.isOfficialMarket(launchedMarket));
        assertEq(PolyfunToken(token).market(), launchedMarket);

        vm.deal(buyer, 1 ether);
        vm.prank(buyer);
        PolyfunMarket(payable(launchedMarket)).buyYes{value: 0.1 ether}(0);
        assertEq(PolyfunMarket(payable(launchedMarket)).yesValue(), (0.1 ether * 9900) / 10_000);
        assertGt(PolyfunMarket(payable(launchedMarket)).yesShares(buyer), 0);
    }

    function test_createLaunch_exactDeployFee() public {
        PolyfunRegistry registry = new PolyfunRegistry();
        PolyfunLauncher launcher = new PolyfunLauncher(
            address(registry),
            address(new PolyfunToken()),
            address(new PolyfunMarket()),
            address(adapter)
        );

        PolyfunLauncher.LaunchParams memory params = PolyfunLauncher.LaunchParams({
            name: "T",
            symbol: "T",
            metadataHash: bytes32(0),
            initialLiquidity: 0,
            burnPolyfun: false
        });

        vm.expectRevert(bytes("DeployFee"));
        launcher.createLaunch{value: PolyfunConstants.DEPLOY_FEE + 1}(params, bytes32(0));
    }
}
