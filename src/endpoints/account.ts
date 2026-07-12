import type { QuvrHttpClient } from "../client.js";
import type {
  PortfolioResponse,
  WatchlistSummary,
} from "../types.js";

export class WatchlistApi {
  constructor(private readonly http: QuvrHttpClient) {}

  /** List the authenticated user's watchlists. Requires session auth. */
  async list(): Promise<WatchlistSummary[]> {
    const { watchlists } = await this.http.get<{
      watchlists: WatchlistSummary[];
    }>("/api/watchlist");
    return watchlists;
  }

  /** Create a new watchlist for the authenticated user. */
  async create(name = "My Watchlist"): Promise<WatchlistSummary> {
    return this.http.post<WatchlistSummary>("/api/watchlist", { name });
  }
}

export class PortfolioApi {
  constructor(private readonly http: QuvrHttpClient) {}

  /** Latest per-token portfolio snapshot + total USD value. Requires auth. */
  async get(): Promise<PortfolioResponse> {
    return this.http.get<PortfolioResponse>("/api/portfolio");
  }
}

export class WaitlistApi {
  constructor(private readonly http: QuvrHttpClient) {}

  /** Join the public QUVR waitlist. No auth required. */
  async join(email: string): Promise<{ ok: true }> {
    return this.http.post<{ ok: true }>("/api/waitlist", { email });
  }
}
