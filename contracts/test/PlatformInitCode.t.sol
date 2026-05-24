// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {PolyfunConstants} from "../src/PolyfunConstants.sol";
import {PolyfunPlatformToken} from "../src/PolyfunPlatformToken.sol";
import {Create2Deployer} from "../src/lib/Create2Deployer.sol";

contract PlatformInitCodeTest is Test {
    function test_platformInitCodeHash() public pure {
        bytes memory initCode = abi.encodePacked(
            type(PolyfunPlatformToken).creationCode,
            abi.encode(PolyfunConstants.FEE_RECEIVER)
        );
        console2.logBytes32(keccak256(initCode));
        console2.log("creationCode len", type(PolyfunPlatformToken).creationCode.length);
    }

    function test_verifyGroundSalt(bytes32 salt) public pure {
        bytes memory initCode = abi.encodePacked(
            type(PolyfunPlatformToken).creationCode,
            abi.encode(PolyfunConstants.FEE_RECEIVER)
        );
        bytes32 initCodeHash = keccak256(initCode);
        address predicted = Create2Deployer.computeAddress(
            salt,
            initCodeHash,
            0xE832E090E85a9A1ae84bb549D50c846FD6284cDC
        );
        console2.log("predicted", predicted);
        console2.log("hasBa5e", PolyfunConstants.hasBa5eSuffix(predicted));
    }
}
