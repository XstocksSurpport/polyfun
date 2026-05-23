// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PolyfunConstants} from "../PolyfunConstants.sol";

/// @notice MVP bonding curve: 1 wei net ETH = 1 wei share (see DEVELOPMENT.md §6.5).
library BondingCurve {
    struct QuoteResult {
        uint256 sharesOut;
        uint16 priceImpactBps;
        uint256 newYesRatioBps;
        bool willTrigger;
    }

    function yesRatioBps(uint256 yesValue, uint256 noValue) internal pure returns (uint256) {
        uint256 total = yesValue + noValue;
        if (total == 0) return 0;
        return (yesValue * 10_000) / total;
    }

    function willTrigger(uint256 yesValue, uint256 noValue, uint16 thresholdBps) internal pure returns (bool) {
        return yesValue >= PolyfunConstants.TRANSITION_THRESHOLD_ETH
            && yesRatioBps(yesValue, noValue) >= thresholdBps;
    }

    function quoteBuyYes(
        uint256 yesValue,
        uint256 noValue,
        uint256 netAmount,
        uint16 thresholdBps
    ) internal pure returns (QuoteResult memory quote) {
        quote.sharesOut = netAmount;
        quote.priceImpactBps = 0;
        uint256 newYes = yesValue + netAmount;
        quote.newYesRatioBps = yesRatioBps(newYes, noValue);
        quote.willTrigger = willTrigger(newYes, noValue, thresholdBps);
    }

    function quoteBuyNo(
        uint256 yesValue,
        uint256 noValue,
        uint256 netAmount,
        uint16 thresholdBps
    ) internal pure returns (QuoteResult memory quote) {
        quote.sharesOut = netAmount;
        quote.priceImpactBps = 0;
        uint256 newNo = noValue + netAmount;
        quote.newYesRatioBps = yesRatioBps(yesValue, newNo);
        quote.willTrigger = willTrigger(yesValue, newNo, thresholdBps);
    }
}
