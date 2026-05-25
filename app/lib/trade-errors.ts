import { TimeoutError } from "@/lib/async";

function extractMessage(error: unknown): string {
  if (error instanceof TimeoutError) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "shortMessage" in error) {
    return String((error as { shortMessage: string }).shortMessage);
  }
  return String(error);
}

function truncate(msg: string, max = 160): string {
  return msg.length > max ? `${msg.slice(0, max)}…` : msg;
}

/** Wallet connect / chain switch errors. */
export function formatWalletError(error: unknown): string {
  const msg = extractMessage(error);
  if (/user rejected|ACTION_REJECTED|USER_REJECTED/i.test(msg)) {
    return "Connection rejected in wallet";
  }
  if (/4902|Unrecognized chain|chain/i.test(msg) && /switch|add/i.test(msg)) {
    return "Could not switch to Base — approve network in wallet";
  }
  if (/NO_ACCOUNTS/i.test(msg)) {
    return "No account selected in wallet";
  }
  if (/Connect your wallet/i.test(msg)) {
    return "Connect your wallet first";
  }
  return truncate(msg);
}

export function formatTradeError(error: unknown): string {
  const msg = extractMessage(error);

  if (error instanceof TimeoutError || /timed out|timeout/i.test(msg)) {
    return msg.includes("wallet") ? msg : "Request timed out — try again";
  }
  if (/user rejected|ACTION_REJECTED|USER_REJECTED/i.test(msg)) {
    return "Transaction rejected in wallet";
  }
  if (/insufficient funds/i.test(msg)) {
    return "Insufficient ETH for trade + gas";
  }
  if (/Reentrancy/i.test(msg)) {
    return "Market contract unavailable — use a newly launched market";
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
  if (/Connect your wallet/i.test(msg)) {
    return "Connect your wallet first";
  }
  return truncate(msg);
}

export function formatLaunchError(error: unknown): string {
  const msg = extractMessage(error);

  if (error instanceof TimeoutError || /timed out|timeout/i.test(msg)) {
    return msg.includes("Metadata") ? "Metadata upload timed out — retry" : "Request timed out — try again";
  }
  if (/user rejected|ACTION_REJECTED|USER_REJECTED/i.test(msg)) {
    return "Transaction rejected in wallet";
  }
  if (/insufficient funds/i.test(msg)) {
    return "Insufficient ETH for deploy fee + gas";
  }
  if (/Create2Failed/i.test(msg)) {
    return "Address already taken — generating a new salt, please try again";
  }
  if (/SuffixMismatch/i.test(msg)) {
    return "Invalid token address suffix — please retry";
  }
  if (/DeployFee/i.test(msg)) {
    return "Incorrect deploy fee amount";
  }
  if (/Salt generation failed/i.test(msg)) {
    return "Could not generate …ba5e address — refresh and retry";
  }
  if (/METADATA|PINATA|NAME_SYMBOL|IMAGE_|RATE_LIMITED/i.test(msg)) {
    return truncate(msg, 120);
  }
  if (/Reentrancy|estimateGas|CALL_EXCEPTION/i.test(msg)) {
    return "Launch failed — check fee and network, then retry";
  }
  if (/Connect your wallet/i.test(msg)) {
    return "Connect your wallet first";
  }
  return "Launch failed — please try again";
}

/** 2% slippage buffer on quoted shares. */
export function minSharesWithSlippage(sharesOut: bigint, bps = 9800n): bigint {
  return (sharesOut * bps) / 10_000n;
}
