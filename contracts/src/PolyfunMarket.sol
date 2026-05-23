// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PolyfunConstants} from "./PolyfunConstants.sol";
import {PolyfunToken} from "./PolyfunToken.sol";
import {BondingCurve} from "./curve/BondingCurve.sol";
import {IMigrationAdapter} from "./interfaces/IPolyfun.sol";

contract PolyfunMarket {
    enum MarketStatus {
        Active,
        Migrated,
        SettledNo
    }

    enum MigrationAdapter {
        None,
        UniswapV3
    }

    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _statusLock = _NOT_ENTERED;

    address public launcher;
    address public token;
    address public creator;
    address public externalPool;
    address public migrationAdapterAddress;

    uint16 public thresholdBps;
    uint256 public expiry;
    MarketStatus public status;
    MigrationAdapter public migrationAdapter;

    uint256 public yesValue;
    uint256 public noValue;
    uint256 public totalYesShares;
    uint256 public totalNoShares;
    uint256 public noSettlementPool;

    mapping(address => uint256) public yesShares;
    mapping(address => uint256) public noShares;
    mapping(address => bool) public yesClaimed;
    mapping(address => bool) public noClaimed;

    event YesPurchased(address indexed buyer, uint256 amountIn, uint256 sharesOut);
    event NoPurchased(address indexed buyer, uint256 amountIn, uint256 sharesOut);
    event MarketMigrated(address indexed market, address indexed pool);
    event MarketSettledNo(address indexed market, uint256 settlementFee);
    event YesTokensClaimed(address indexed account, uint256 amount);
    event NoPayoutClaimed(address indexed account, uint256 amount);

    modifier nonReentrant() {
        require(_statusLock == _NOT_ENTERED, "Reentrancy");
        _statusLock = _ENTERED;
        _;
        _statusLock = _NOT_ENTERED;
    }

    modifier onlyLauncher() {
        require(msg.sender == launcher, "OnlyLauncher");
        _;
    }

    function initialize(
        address _launcher,
        address _token,
        address _creator,
        uint16 _thresholdBps,
        uint256 _duration,
        address _migrationAdapter
    ) external {
        require(launcher == address(0), "Initialized");
        launcher = _launcher;
        token = _token;
        creator = _creator;
        thresholdBps = _thresholdBps;
        expiry = block.timestamp + _duration;
        migrationAdapterAddress = _migrationAdapter;
        status = MarketStatus.Active;
    }

    function buyYes(uint256 minSharesOut) external payable nonReentrant {
        require(status == MarketStatus.Active, "NotActive");
        require(block.timestamp < expiry, "Expired");
        require(msg.value > 0, "Zero");

        uint256 fee = (msg.value * PolyfunConstants.TRADING_FEE_BPS) / 10_000;
        uint256 net = msg.value - fee;
        _sendFee(fee);

        (uint256 sharesOut, uint256 newYesRatioBps, bool willTrigger) = _quoteBuyYes(net);
        require(sharesOut >= minSharesOut, "Slippage");

        yesValue += net;
        yesShares[msg.sender] += sharesOut;
        totalYesShares += sharesOut;

        emit YesPurchased(msg.sender, msg.value, sharesOut);

        if (willTrigger && yesValue >= PolyfunConstants.TRANSITION_THRESHOLD_ETH) {
            _settleYesWin(msg.sender);
        }
    }

    function buyNo(uint256 minSharesOut) external payable nonReentrant {
        require(status == MarketStatus.Active, "NotActive");
        require(block.timestamp < expiry, "Expired");
        require(msg.value > 0, "Zero");

        uint256 fee = (msg.value * PolyfunConstants.TRADING_FEE_BPS) / 10_000;
        uint256 net = msg.value - fee;
        _sendFee(fee);

        (uint256 sharesOut,,) = _quoteBuyNo(net);
        require(sharesOut >= minSharesOut, "Slippage");

        noValue += net;
        noShares[msg.sender] += sharesOut;
        totalNoShares += sharesOut;

        emit NoPurchased(msg.sender, msg.value, sharesOut);
    }

    function settleNo() external nonReentrant {
        require(status == MarketStatus.Active, "NotActive");
        require(block.timestamp >= expiry, "NotExpired");
        require(!BondingCurve.willTrigger(yesValue, noValue, thresholdBps), "YesWon");

        uint256 balance = address(this).balance;
        uint256 settlementFee = (balance * PolyfunConstants.SETTLEMENT_FEE_BPS) / 10_000;
        _sendFee(settlementFee);

        noSettlementPool = address(this).balance;
        status = MarketStatus.SettledNo;

        emit MarketSettledNo(address(this), settlementFee);
    }

    function claimYesTokens() external nonReentrant {
        require(status == MarketStatus.Migrated, "NotMigrated");
        require(!yesClaimed[msg.sender], "Claimed");
        require(yesShares[msg.sender] > 0, "NoShares");

        yesClaimed[msg.sender] = true;
        uint256 amount = (yesShares[msg.sender] * PolyfunConstants.INTERNAL_POOL_SUPPLY) / totalYesShares;
        PolyfunToken(token).transferFromMarket(msg.sender, amount);
        emit YesTokensClaimed(msg.sender, amount);
    }

    function claimNoPayout() external nonReentrant {
        require(status == MarketStatus.SettledNo, "NotSettled");
        require(!noClaimed[msg.sender], "Claimed");
        require(noShares[msg.sender] > 0, "NoShares");

        noClaimed[msg.sender] = true;
        uint256 amount = (noShares[msg.sender] * noSettlementPool) / totalNoShares;
        require(amount > 0, "ZeroPayout");
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "TransferFailed");
        emit NoPayoutClaimed(msg.sender, amount);
    }

    function quoteBuyYes(uint256 amountIn)
        external
        view
        returns (uint256 sharesOut, uint256 newYesRatioBps, bool willTrigger)
    {
        uint256 fee = (amountIn * PolyfunConstants.TRADING_FEE_BPS) / 10_000;
        if (amountIn <= fee) return (0, BondingCurve.yesRatioBps(yesValue, noValue), false);
        return _quoteBuyYes(amountIn - fee);
    }

    function quoteBuyNo(uint256 amountIn)
        external
        view
        returns (uint256 sharesOut, uint256 newYesRatioBps, bool willTrigger)
    {
        uint256 fee = (amountIn * PolyfunConstants.TRADING_FEE_BPS) / 10_000;
        if (amountIn <= fee) return (0, BondingCurve.yesRatioBps(yesValue, noValue), false);
        return _quoteBuyNo(amountIn - fee);
    }

    function _quoteBuyYes(uint256 net)
        internal
        view
        returns (uint256 sharesOut, uint256 newYesRatioBps, bool willTrigger)
    {
        BondingCurve.QuoteResult memory quote =
            BondingCurve.quoteBuyYes(yesValue, noValue, net, thresholdBps);
        return (quote.sharesOut, quote.newYesRatioBps, quote.willTrigger);
    }

    function _quoteBuyNo(uint256 net)
        internal
        view
        returns (uint256 sharesOut, uint256 newYesRatioBps, bool willTrigger)
    {
        BondingCurve.QuoteResult memory quote =
            BondingCurve.quoteBuyNo(yesValue, noValue, net, thresholdBps);
        return (quote.sharesOut, quote.newYesRatioBps, quote.willTrigger);
    }

    function _settleYesWin(address triggerBuyer) internal {
        status = MarketStatus.Migrated;
        migrationAdapter = MigrationAdapter.UniswapV3;

        uint256 balance = address(this).balance;
        require(balance > PolyfunConstants.MIGRATION_FEE, "PoolTooSmall");
        _sendFee(PolyfunConstants.MIGRATION_FEE);

        uint256 lpEth = address(this).balance;
        require(lpEth > 0, "NoLpEth");

        PolyfunToken(token).transferForLp(
            migrationAdapterAddress, PolyfunConstants.EXTERNAL_LP_SUPPLY
        );

        externalPool = IMigrationAdapter(migrationAdapterAddress).migrate{value: lpEth}(
            token, PolyfunConstants.EXTERNAL_LP_SUPPLY, lpEth
        );

        PolyfunToken(token).enableTransfers();

        if (triggerBuyer != address(0) && yesShares[triggerBuyer] > 0 && !yesClaimed[triggerBuyer]) {
            yesClaimed[triggerBuyer] = true;
            uint256 amount =
                (yesShares[triggerBuyer] * PolyfunConstants.INTERNAL_POOL_SUPPLY) / totalYesShares;
            PolyfunToken(token).transferFromMarket(triggerBuyer, amount);
            emit YesTokensClaimed(triggerBuyer, amount);
        }

        emit MarketMigrated(address(this), externalPool);
    }

    function _sendFee(uint256 amount) internal {
        if (amount == 0) return;
        (bool ok,) = PolyfunConstants.FEE_RECEIVER.call{value: amount}("");
        require(ok, "FeeTransferFailed");
    }

    receive() external payable {
        require(status == MarketStatus.Active, "NotActive");
    }
}
