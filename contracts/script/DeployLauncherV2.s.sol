// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PolyfunRegistry} from "../src/PolyfunRegistry.sol";
import {PolyfunLauncher} from "../src/PolyfunLauncher.sol";

/// @notice Redeploy Registry + Launcher (48h duration) reusing existing implementations.
contract DeployLauncherV2 is Script {
    function run() external {
        address tokenImpl = vm.envAddress("TOKEN_IMPLEMENTATION");
        address marketImpl = vm.envAddress("MARKET_IMPLEMENTATION");
        address adapter = vm.envAddress("MIGRATION_ADAPTER");

        vm.startBroadcast();

        uint256 deployBlock = block.number;
        PolyfunRegistry registry = new PolyfunRegistry();
        PolyfunLauncher launcher = new PolyfunLauncher(address(registry), tokenImpl, marketImpl, adapter);

        vm.stopBroadcast();

        require(launcher.defaultDuration() == 2 days, "DurationNot48h");

        console2.log("Registry:", address(registry));
        console2.log("Launcher:", address(launcher));
        console2.log("defaultDuration:", launcher.defaultDuration());
        console2.log("Deploy block:", deployBlock);

        string memory json = string.concat(
            "{\n",
            '  "registry": "', vm.toString(address(registry)), '",\n',
            '  "launcher": "', vm.toString(address(launcher)), '",\n',
            '  "launcherDeployBlock": ', vm.toString(deployBlock), "\n",
            "}\n"
        );
        vm.writeFile("../deployments/launcher-v2-bootstrap.json", json);
    }
}
