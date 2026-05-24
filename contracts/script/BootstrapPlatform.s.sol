// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PolyfunLauncher} from "../src/PolyfunLauncher.sol";

contract BootstrapPlatform is Script {
    function run() external {
        address launcher = vm.envAddress("LAUNCHER_ADDRESS");
        bytes32 rawSalt = vm.envBytes32("PLATFORM_SALT");
        bytes32 metadataHash = vm.envBytes32("PLATFORM_METADATA_HASH");

        vm.startBroadcast();

        (address market, address token) = PolyfunLauncher(launcher).createLaunch{value: 0.0005 ether}(
            PolyfunLauncher.LaunchParams({
                name: "Polyfun",
                symbol: "poly",
                metadataHash: metadataHash,
                initialLiquidity: 0,
                burnPolyfun: false
            }),
            rawSalt
        );

        vm.stopBroadcast();

        console2.log("Platform market:", market);
        console2.log("Platform token:", token);

        string memory json = string.concat(
            "{\n",
            '  "platformMarket": "', vm.toString(market), '",\n',
            '  "platformToken": "', vm.toString(token), '",\n',
            '  "platformDeployBlock": ', vm.toString(block.number), "\n",
            "}\n"
        );
        vm.writeFile("../deployments/platform-bootstrap.json", json);
    }
}
