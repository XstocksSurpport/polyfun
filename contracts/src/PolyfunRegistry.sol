// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PolyfunRegistry {
    struct Record {
        address market;
        address token;
        address creator;
        bytes32 metadataHash;
        uint256 createdAt;
        bool isOfficial;
    }

    address public launcher;
    mapping(address => Record) public markets;
    mapping(address => bool) public isOfficialMarket;
    mapping(address => bool) public isOfficialToken;

    event Registered(address indexed market, address indexed token, address indexed creator);

    modifier onlyLauncher() {
        require(msg.sender == launcher, "OnlyLauncher");
        _;
    }

    function setLauncher(address _launcher) external {
        require(launcher == address(0), "Set");
        launcher = _launcher;
    }

    function register(
        address market,
        address token,
        address creator,
        bytes32 metadataHash
    ) external onlyLauncher {
        markets[market] = Record({
            market: market,
            token: token,
            creator: creator,
            metadataHash: metadataHash,
            createdAt: block.timestamp,
            isOfficial: true
        });
        isOfficialMarket[market] = true;
        isOfficialToken[token] = true;
        emit Registered(market, token, creator);
    }
}
