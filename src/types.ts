export interface QuiverClientOptions {
  /** Base URL of the Quiver app, e.g. "https://quvr.site". No trailing slash. */
  baseUrl: string;
  /** Optional fetch implementation override (useful for testing / non-browser envs). */
  fetchImpl?: typeof fetch;
  /** Request timeout in ms. Default 10_000. */
  timeoutMs?: number;
  /**
   * How long GET responses are cached in-memory before a fresh request is made,
   * in ms. Default 20_000 (20s). This is what keeps every consumer of this SDK
   * (widget, CLI, bot) from hammering endpoints that back onto metered
   * third-party data providers. Set to 0 to disable caching (not recommended
   * for anything that polls automatically).
   */
  cacheTtlMs?: number;
  /**
   * If a request is rate-limited (HTTP 429), how many times to retry with
   * exponential backoff before giving up. Default 2.
   */
  maxRetriesOn429?: number;
}

export interface Token {
  id: string;
  symbol: string;
  name: string;
  category: string;
  cached_price_usd: number | string | null;
}

export interface Chain {
  id: number;
  name: string;
  isSource: boolean;
  isDestination: boolean;
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
  /** Raw amount in the smallest unit (wei/base units), as a string to avoid overflow. */
  amount: string;
  recipientAddress: `0x${string}`;
  route: BridgeRoute;
}

export interface QuoteResponse {
  route: BridgeRoute;
  fee: string;
  estimatedTimeSeconds?: number;
  [key: string]: unknown;
}

export interface TrenchesToken {
  address: string;
  symbol: string;
  name: string;
  priceUsd?: number;
  marketCapUsd?: number;
  [key: string]: unknown;
}

export interface TrenchesResponse {
  tokens: TrenchesToken[];
  [key: string]: unknown;
}

export interface LaunchpadToken {
  address: string;
  symbol: string;
  name: string;
  imageUrl?: string;
  [key: string]: unknown;
}

export class QuiverApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "QuiverApiError";
    this.status = status;
    this.body = body;
  }
}
