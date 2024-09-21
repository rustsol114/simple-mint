export const SOL_PRICE_API =
  "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";

// export const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC ?? "";
// export const SOLANA_RPC = "https://solana-devnet.g.alchemy.com/v2/nPdtpY0LxgpMlnGOA94LoTCpEy-Nd2gG";
export const SOLANA_RPC = "https://devnet.helius-rpc.com/?api-key=934757b5-6bfc-49d7-a577-b40b81662855";
// export const SOLANA_RPC = "https://mainnet.helius-rpc.com/?api-key=934757b5-6bfc-49d7-a577-b40b81662855"
// export const SOLANA_RPC = "https://solana-mainnet.g.alchemy.com/v2/nPdtpY0LxgpMlnGOA94LoTCpEy-Nd2gG";


export const EVENT_QUEUE_LENGTH = 2978;
export const EVENT_SIZE = 88;
export const EVENT_QUEUE_HEADER_SIZE = 32;

export const REQUEST_QUEUE_LENGTH = 63;
export const REQUEST_SIZE = 80;
export const REQUEST_QUEUE_HEADER_SIZE = 32;

export const ORDERBOOK_LENGTH = 909;
export const ORDERBOOK_NODE_SIZE = 72;
export const ORDERBOOK_HEADER_SIZE = 40;

export function calculateTotalAccountSize(
  individualAccountSize: number,
  accountHeaderSize: number,
  length: number
) {
  const accountPadding = 12;
  const minRequiredSize =
    accountPadding + accountHeaderSize + length * individualAccountSize;

  const modulo = minRequiredSize % 8;

  return modulo <= 4
    ? minRequiredSize + (4 - modulo)
    : minRequiredSize + (8 - modulo + 4);
}