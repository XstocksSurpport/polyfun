// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PolyfunToken} from "../src/PolyfunToken.sol";
import {PolyfunMarket} from "../src/PolyfunMarket.sol";
import {PolyfunRegistry} from "../src/PolyfunRegistry.sol";
import {PolyfunLauncher} from "../src/PolyfunLauncher.sol";
import {UniswapV3Adapter} from "../src/adapters/UniswapV3Adapter.sol";
import {PolyfunChainConfig} from "../src/PolyfunChainConfig.sol";

contract DeployPolyfun is Script {
    struct Deployment {
        uint256 chainId;
        uint256 deployBlock;
        address registry;
        address tokenImplementation;
        address marketImplementation;
        address migrationAdapter;
        address launcher;
    }

    function run() external {
        uint256 chainId = block.chainid;
        PolyfunChainConfig.DexAddresses memory dex = PolyfunChainConfig.getDex(chainId);

        console2.log("=== Polyfun Deploy ===");
        console2.log("Chain ID:", chainId);
        console2.log("V3 Factory:", dex.v3Factory);
        console2.log("V3 NFPM:", dex.v3Nfpm);

        vm.startBroadcast();

        uint256 deployBlock = block.number;

        PolyfunRegistry registry = new PolyfunRegistry();
        address tokenImpl = address(new PolyfunToken());
        address marketImpl = address(new PolyfunMarket());
        UniswapV3Adapter adapter = new UniswapV3Adapter(dex.v3Factory, dex.v3Nfpm, dex.weth);
        PolyfunLauncher launcher = new PolyfunLauncher(
            address(registry), tokenImpl, marketImpl, address(adapter)
        );

        vm.stopBroadcast();

        Deployment memory d = Deployment({
            chainId: chainId,
            deployBlock: deployBlock,
            registry: address(registry),
            tokenImplementation: tokenImpl,
            marketImplementation: marketImpl,
            migrationAdapter: address(adapter),
            launcher: address(launcher)
        });

        _log(d);
        _writeJson(d);
    }

    function _log(Deployment memory d) internal pure {
        console2.log("Registry:", d.registry);
        console2.log("Token impl:", d.tokenImplementation);
        console2.log("Market impl:", d.marketImplementation);
        console2.log("V3 Adapter:", d.migrationAdapter);
        console2.log("Launcher:", d.launcher);
        console2.log("Deploy block:", d.deployBlock);
    }

    function _writeJson(Deployment memory d) internal {
        string memory json = string.concat(
            "{\n",
            '  "chainId": ', vm.toString(d.chainId), ",\n",
            '  "deployBlock": ', vm.toString(d.deployBlock), ",\n",
            '  "registry": "', vm.toString(d.registry), '",\n',
            '  "tokenImplementation": "', vm.toString(d.tokenImplementation), '",\n',
            '  "marketImplementation": "', vm.toString(d.marketImplementation), '",\n',
            '  "migrationAdapter": "', vm.toString(d.migrationAdapter), '",\n',
            '  "launcher": "', vm.toString(d.launcher), '"\n',
            "}\n"
        );

        string memory path = d.chainId == 84532
            ? "../deployments/base-sepolia.json"
            : d.chainId == 8453
                ? "../deployments/base-mainnet.json"
                : "../deployments/latest.json";

        vm.writeFile(path, json);
        console2.log("Wrote:", path);
    }
}
