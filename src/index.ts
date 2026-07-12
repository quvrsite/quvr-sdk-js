import { QuvrHttpClient, type QuvrClientOptions, QuvrApiRequestError } from "./client.js";
import { TokensApi } from "./endpoints/tokens.js";
import { ChainsApi } from "./endpoints/chains.js";
import { TickerApi } from "./endpoints/ticker.js";
import { BridgeApi } from "./endpoints/bridge.js";
import {
  WatchlistApi,
  PortfolioApi,
  WaitlistApi,
} from "./endpoints/account.js";

export * from "./types.js";
export { QuvrApiRequestError, type QuvrClientOptions };

/**
 * Unofficial community SDK for the QUVR API (quvr.site).
 *
 * QUVR is a bridge aggregator + stock token / USDG watchlist for
 * Robinhood Chain. This client wraps the public Next.js API routes so
 * other apps, bots, and dashboards can build on top of QUVR without
 * re-implementing HTTP plumbing.
 *
 * @example
 * ```ts
 * import { QuvrClient } from "@quvrsite/sdk";
 *
 * const quvr = new QuvrClient();
 * const { prices } = await quvr.ticker.get();
 * console.log(prices);
 * ```
 */
export class QuvrClient {
  readonly tokens: TokensApi;
  readonly chains: ChainsApi;
  readonly ticker: TickerApi;
  readonly bridge: BridgeApi;
  readonly watchlist: WatchlistApi;
  readonly portfolio: PortfolioApi;
  readonly waitlist: WaitlistApi;

  constructor(options: QuvrClientOptions = {}) {
    const http = new QuvrHttpClient(options);
    this.tokens = new TokensApi(http);
    this.chains = new ChainsApi(http);
    this.ticker = new TickerApi(http);
    this.bridge = new BridgeApi(http);
    this.watchlist = new WatchlistApi(http);
    this.portfolio = new PortfolioApi(http);
    this.waitlist = new WaitlistApi(http);
  }
}

export default QuvrClient;
