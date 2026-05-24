// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PolyfunConstants} from "../src/PolyfunConstants.sol";
import {PolyfunPlatformToken} from "../src/PolyfunPlatformToken.sol";
import {PolyfunCreate2Factory} from "../src/PolyfunCreate2Factory.sol";
import {Create2Deployer} from "../src/lib/Create2Deployer.sol";

contract DeployPlatformToken is Script {
    function run() external {
        uint256 chainId = block.chainid;
        address treasury = PolyfunConstants.FEE_RECEIVER;

        bytes memory initCode = abi.encodePacked(
            type(PolyfunPlatformToken).creationCode,
            abi.encode(treasury)
        );
        bytes32 initCodeHash = keccak256(initCode);
        bytes32 salt = vm.envBytes32("POLYFUN_SALT");

        vm.startBroadcast();

        PolyfunCreate2Factory factory;
        try vm.envAddress("CREATE2_FACTORY") returns (address factoryAddr) {
            factory = PolyfunCreate2Factory(factoryAddr);
            console2.log("Create2 Factory (existing):", factoryAddr);
        } catch {
            factory = new PolyfunCreate2Factory();
            console2.log("Create2 Factory:", address(factory));
        }

        address predicted = Create2Deployer.computeAddress(salt, initCodeHash, address(factory));
        require(PolyfunConstants.hasBa5eSuffix(predicted), "SuffixMismatch");

        address token = factory.deploy(salt, initCode);
        require(token == predicted, "AddressMismatch");

        vm.stopBroadcast();

        console2.log("POLYFUN:", token);

        string memory json = string.concat(
            "{\n",
            '  "polyfun": "', vm.toString(token), '",\n',
            '  "polyfunCreate2Factory": "', vm.toString(address(factory)), '",\n',
            '  "polyfunTreasury": "', vm.toString(treasury), '",\n',
            '  "polyfunDeployBlock": ', vm.toString(block.number), "\n",
            "}\n"
        );

        string memory path = chainId == 8453
            ? "../deployments/polyfun-platform-base-mainnet.json"
            : "../deployments/polyfun-platform-latest.json";

        vm.writeFile(path, json);
    }
}
