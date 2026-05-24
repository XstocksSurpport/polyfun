// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PolyfunLauncher} from "../src/PolyfunLauncher.sol";

contract BootstrapGenesis is Script {
    function run() external {
        address launcher = vm.envAddress("LAUNCHER_ADDRESS");
        bytes32 rawSalt = vm.envBytes32("GENESIS_SALT");
        bytes32 metadataHash = vm.envBytes32("GENESIS_METADATA_HASH");

        vm.startBroadcast();

        (address market, address token) = PolyfunLauncher(launcher).createLaunch{value: 0.0005 ether}(
            PolyfunLauncher.LaunchParams({
                name: "Polyfun Genesis",
                symbol: "PFUN",
                metadataHash: metadataHash,
                initialLiquidity: 0,
                burnPolyfun: false
            }),
            rawSalt
        );

        vm.stopBroadcast();

        console2.log("Genesis market:", market);
        console2.log("Genesis token:", token);

        string memory json = string.concat(
            "{\n",
            '  "genesisMarket": "', vm.toString(market), '",\n',
            '  "genesisToken": "', vm.toString(token), '",\n',
            '  "genesisDeployBlock": ', vm.toString(block.number), "\n",
            "}\n"
        );
        vm.writeFile("../deployments/genesis-bootstrap.json", json);
    }
}
