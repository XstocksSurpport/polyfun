// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PolyfunConstants} from "./PolyfunConstants.sol";
import {PolyfunToken} from "./PolyfunToken.sol";
import {PolyfunMarket} from "./PolyfunMarket.sol";
import {PolyfunRegistry} from "./PolyfunRegistry.sol";
import {Create2Deployer} from "./lib/Create2Deployer.sol";

contract PolyfunLauncher {
    struct LaunchParams {
        string name;
        string symbol;
        bytes32 metadataHash;
        uint256 initialLiquidity;
        bool burnPolyfun;
    }

    PolyfunRegistry public immutable registry;
    address public immutable tokenImplementation;
    address public immutable marketImplementation;
    address public immutable migrationAdapter;

    uint256 public defaultDuration = 2 days;

    event LaunchCreated(
        address indexed market,
        address indexed token,
        address indexed creator,
        bytes32 rawSalt
    );

    constructor(
        address _registry,
        address _tokenImplementation,
        address _marketImplementation,
        address _migrationAdapter
    ) {
        registry = PolyfunRegistry(_registry);
        tokenImplementation = _tokenImplementation;
        marketImplementation = _marketImplementation;
        migrationAdapter = _migrationAdapter;
        registry.setLauncher(address(this));
    }

    function quoteCreationFee(bool) external pure returns (uint256 fee) {
        return PolyfunConstants.DEPLOY_FEE;
    }

    function predictTokenAddress(address creator, bytes32 rawSalt) external view returns (address) {
        bytes32 finalSalt = PolyfunConstants.boundSalt(creator, rawSalt);
        return Create2Deployer.computeAddress(
            finalSalt,
            Create2Deployer.cloneHash(tokenImplementation),
            address(this)
        );
    }

    function predictMarketAddress(address creator, bytes32 rawSalt) external view returns (address) {
        bytes32 finalSalt = PolyfunConstants.boundSalt(creator, rawSalt);
        bytes32 marketSalt = _marketSalt(finalSalt);
        return Create2Deployer.computeAddress(
            marketSalt,
            Create2Deployer.cloneHash(marketImplementation),
            address(this)
        );
    }

    function createLaunch(LaunchParams calldata params, bytes32 rawSalt)
        external
        payable
        returns (address market, address token)
    {
        require(msg.value == PolyfunConstants.DEPLOY_FEE, "DeployFee");
        require(params.initialLiquidity == 0, "NoCreatorLiquidity");

        _sendFee(PolyfunConstants.DEPLOY_FEE);

        bytes32 finalSalt = PolyfunConstants.boundSalt(msg.sender, rawSalt);
        bytes32 marketSalt = _marketSalt(finalSalt);

        market = Create2Deployer.deployClone(marketSalt, marketImplementation);

        token = Create2Deployer.deployClone(finalSalt, tokenImplementation);

        require(PolyfunConstants.hasBa5eSuffix(token), "SuffixMismatch");

        PolyfunToken(token).initialize(params.name, params.symbol, market);
        PolyfunMarket(payable(market)).initialize(
            address(this),
            token,
            msg.sender,
            PolyfunConstants.THRESHOLD_BPS,
            defaultDuration,
            migrationAdapter
        );

        registry.register(market, token, msg.sender, params.metadataHash);
        emit LaunchCreated(market, token, msg.sender, rawSalt);
    }

    function _marketSalt(bytes32 finalSalt) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(finalSalt, "POLYFUN_MARKET"));
    }

    function _sendFee(uint256 amount) internal {
        (bool ok,) = PolyfunConstants.FEE_RECEIVER.call{value: amount}("");
        require(ok, "FeeTransferFailed");
    }
}
