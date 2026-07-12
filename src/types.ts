/**
 * Shared type definitions for the QUVR public API responses.
 * These mirror the shapes returned by the QUVR Next.js API routes
 * (app/api/tokens, app/api/chains, app/api/quote, app/api/ticker, ...).
 *
 * NOTE: these are best-effort types based on the publicly observable API
 * surface. If the QUVR team changes response shapes, please open a PR.
 */

export type TokenCategory = "stock" | "stablecoin" | "other";

export interface QuvrToken {
  id: string;
  symbol: string;
  name: string;
  category: TokenCategory;
  cached_price_usd: number | null;
}

export interface QuvrChain {
  id: number;
  name: string;
  explorer_url: string;
}

export type BridgeRoute =
  | "canonical_arbitrum"
  | "layerzero_stargate"
  | "chainlink_ccip"
  | "lifi_0x";

export interface QuoteRequest {
  srcChainId: number;
  dstChainId: number;
  tokenSymbol: string;
  /** Raw units (wei) as a decimal string, to avoid precision loss. */
  amount: string;
  recipientAddress: `0x${string}`;
  route: BridgeRoute;
}

export interface QuoteResponse {
  route: BridgeRoute;
  srcChainId: number;
  dstChainId: number;
  tokenSymbol: string;
  amountIn: string;
  amountOut: string;
  feeUsd?: number;
  estimatedSeconds?: number;
  [key: string]: unknown;
}

export type TickerBadge =
  | "split queued"
  | "reverse split queued"
  | "dividend queued"
  | null;

export interface LivePrice {
  symbol: string;
  priceUsd: number;
  changePct24h: number | null;
  tone: "up" | "down" | "flat";
  badge: TickerBadge;
  multiplier?: string | null;
}

export interface TickerResponse {
  prices: LivePrice[];
}

export interface BridgeInitiateRequest {
  srcChainId: number;
  dstChainId: number;
  assetId: string;
  amountRaw: string;
  srcTxHash: `0x${string}`;
  route: BridgeRoute;
}

export interface WatchlistSummary {
  id: string;
  name: string;
  is_default: boolean;
  created_at: string;
}

export interface PortfolioHolding {
  token_id: string;
  ui_balance: number;
  price_usd: number;
  value_usd: number;
  snapshot_at: string;
  tokens: {
    symbol: string;
    name: string;
    category: TokenCategory;
  };
}

export interface PortfolioResponse {
  holdings: PortfolioHolding[];
  totalValueUsd: number;
}

export interface QuvrApiError {
  error: string | Record<string, unknown>;
}
