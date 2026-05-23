// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PolyfunConstants} from "./PolyfunConstants.sol";

contract PolyfunToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public market;
    bool public transfersEnabled;
    uint256 public launchBlock;
    bool private _initialized;

    uint256 private constant LAUNCH_GUARD_BLOCKS = 60;
    uint256 private constant MAX_BUY_BPS = 50;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    modifier onlyMarket() {
        require(msg.sender == market, "OnlyMarket");
        _;
    }

    function initialize(string memory _name, string memory _symbol, address _market) external {
        require(!_initialized, "Initialized");
        _initialized = true;
        name = _name;
        symbol = _symbol;
        market = _market;
        totalSupply = PolyfunConstants.TOTAL_SUPPLY;
        balanceOf[_market] = totalSupply;
        emit Transfer(address(0), _market, totalSupply);
    }

    function enableTransfers() external onlyMarket {
        transfersEnabled = true;
        launchBlock = block.number;
    }

    function transferFromMarket(address to, uint256 amount) external onlyMarket {
        _transfer(market, to, amount);
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
        require(transfersEnabled, "Locked");
        if (from != address(0) && to != address(0)) {
            _checkLaunchProtection(to, amount);
        }
        require(balanceOf[from] >= amount, "Balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }

    function _checkLaunchProtection(address buyer, uint256 amount) internal view {
        if (launchBlock == 0 || block.number > launchBlock + LAUNCH_GUARD_BLOCKS) return;
        require(buyer.code.length == 0, "ContractBuyBlocked");
        require(amount <= (totalSupply * MAX_BUY_BPS) / 10_000, "MaxBuyExceeded");
    }
}
