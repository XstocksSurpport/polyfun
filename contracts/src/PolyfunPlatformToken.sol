// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PolyfunConstants} from "./PolyfunConstants.sol";

/// @notice Fixed-supply POLYFUN platform token (standard ERC-20, not a market clone).
contract PolyfunPlatformToken {
    string public constant name = "Polyfun";
    string public constant symbol = "POLY";
    uint8 public constant decimals = 18;

    uint256 public immutable totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(address treasury) {
        require(treasury != address(0), "ZeroTreasury");
        totalSupply = PolyfunConstants.TOTAL_SUPPLY;
        balanceOf[treasury] = totalSupply;
        emit Transfer(address(0), treasury, totalSupply);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "Allowance");
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(balanceOf[from] >= amount, "Balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}
