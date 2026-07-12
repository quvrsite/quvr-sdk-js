import type { QuvrHttpClient } from "../client.js";
import type {
  BridgeInitiateRequest,
  QuoteRequest,
  QuoteResponse,
} from "../types.js";

export class BridgeApi {
  constructor(private readonly http: QuvrHttpClient) {}

  /**
   * Get a bridge quote for a given route. Currently only
   * `layerzero_stargate` returns a real on-chain quote; other routes
   * intentionally respond with 501 until implemented server-side.
   */
  async quote(req: QuoteRequest): Promise<QuoteResponse> {
    return this.http.post<QuoteResponse>("/api/quote", req);
  }

  /**
   * Record a bridge transaction after the source-chain transaction has
   * been sent. Requires an authenticated session (SIWE cookie).
   */
  async initiate(req: BridgeInitiateRequest): Promise<{ id: string }> {
    return this.http.post<{ id: string }>("/api/bridge/initiate", req);
  }
}
