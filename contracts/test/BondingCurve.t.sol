// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {BondingCurve} from "../src/curve/BondingCurve.sol";
import {PolyfunConstants} from "../src/PolyfunConstants.sol";

contract BondingCurveTest is Test {
    function test_yesTriggerAtFourEthAndNinetyPercent() public pure {
        uint256 yes = 4 ether;
        uint256 no = 0.44 ether;
        assertTrue(BondingCurve.willTrigger(yes, no, PolyfunConstants.THRESHOLD_BPS));
        assertEq(BondingCurve.yesRatioBps(yes, no), 9009);
    }

    function test_quoteBuyYes_returnsNetAsShares() public pure {
        BondingCurve.QuoteResult memory q = BondingCurve.quoteBuyYes(0, 0, 1 ether, 9000);
        assertEq(q.sharesOut, 1 ether);
    }
}
