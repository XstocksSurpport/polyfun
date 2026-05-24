// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Create2Deployer} from "./lib/Create2Deployer.sol";

contract PolyfunCreate2Factory {
    function predict(bytes32 salt, bytes32 initCodeHash) external view returns (address) {
        return Create2Deployer.computeAddress(salt, initCodeHash, address(this));
    }

    function deploy(bytes32 salt, bytes calldata initCode) external returns (address deployed) {
        return Create2Deployer.deploy(salt, initCode);
    }
}
