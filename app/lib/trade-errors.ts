export function formatTradeError(error: unknown): string {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "shortMessage" in error
        ? String((error as { shortMessage: string }).shortMessage)
        : String(error);

  if (/user rejected|ACTION_REJECTED|USER_REJECTED/i.test(msg)) {
    return "Transaction rejected in wallet";
  }
  if (/insufficient funds/i.test(msg)) {
    return "Insufficient ETH for trade + gas";
  }
  if (/Reentrancy/i.test(msg)) {
    return "Market contract unavailable — redeploy required (contact team or use a newly launched market)";
  }
  if (/Slippage/i.test(msg)) {
    return "Price moved — retry with a fresh quote";
  }
  if (/NotActive|Expired|Zero/i.test(msg)) {
    return "Market is not open for trading";
  }
  if (/estimateGas|CALL_EXCEPTION/i.test(msg)) {
    return "Trade simulation failed — check amount and market status";
  }
  return msg.length > 160 ? `${msg.slice(0, 160)}…` : msg;
}

/** 2% slippage buffer on quoted shares. */
export function minSharesWithSlippage(sharesOut: bigint, bps = 9800n): bigint {
  return (sharesOut * bps) / 10_000n;
}
