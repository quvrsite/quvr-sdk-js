import type {
  QuiverClientOptions,
  Token,
  Chain,
  QuoteRequest,
  QuoteResponse,
  TrenchesResponse,
  LaunchpadToken,
} from "./types.js";
import { QuiverApiError } from "./types.js";

interface CacheEntry {
  expiresAt: number;
  value: unknown;
}

/**
 * QuiverClient wraps Quiver's PUBLIC API routes only (no session/auth
 * required). Endpoints that operate on a specific user's data — watchlist,
 * portfolio, price alerts — require a SIWE session cookie set by the Quiver
 * web app itself and are intentionally NOT included here.
 *
 * SAFE-BY-DEFAULT: GET requests are cached in-memory for `cacheTtlMs` (default
 * 20s) and 429 responses trigger exponential backoff instead of an immediate
 * retry storm. This matters because some Quiver endpoints (Trenches) sit on
 * top of a metered third-party data provider — every consumer of this SDK
 * (widget, CLI, bot) inherits this behavior automatically, so nobody has to
 * remember to rate-limit themselves by hand. Don't bypass this by creating a
 * fresh QuiverClient per-request — reuse one instance so the cache is shared.
 */
export class QuiverClient {
  private baseUrl: string;
  private fetchImpl: typeof fetch;
  private timeoutMs: number;
  private cacheTtlMs: number;
  private maxRetriesOn429: number;
  private cache = new Map<string, CacheEntry>();
  private inflight = new Map<string, Promise<unknown>>();

  constructor(options: QuiverClientOptions) {
    if (!options.baseUrl) throw new Error("QuiverClient: baseUrl is required");
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.cacheTtlMs = options.cacheTtlMs ?? 20_000;
    this.maxRetriesOn429 = options.maxRetriesOn429 ?? 2;
  }

  /** Drops all cached responses. Rarely needed — mainly for tests. */
  clearCache() {
    this.cache.clear();
  }

  private async doFetch(path: string, init: RequestInit | undefined, attempt: number): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      });

      if (res.status === 429 && attempt < this.maxRetriesOn429) {
        const retryAfterHeader = res.headers.get("retry-after");
        const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : null;
        const backoffMs = retryAfterMs ?? Math.min(2000 * 2 ** attempt, 15_000);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return this.doFetch(path, init, attempt + 1);
      }

      const isJson = res.headers.get("content-type")?.includes("application/json");
      const body = isJson ? await res.json().catch(() => null) : await res.text();
      if (!res.ok) {
        throw new QuiverApiError(
          typeof body === "object" && body && "error" in (body as Record<string, unknown>)
            ? String((body as Record<string, unknown>).error)
            : `Request to ${path} failed with status ${res.status}`,
          res.status,
          body
        );
      }
      return body;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * GET requests are cached and de-duplicated: concurrent calls for the same
   * path share one in-flight request instead of firing N identical calls.
   */
  private async requestCached<T>(path: string): Promise<T> {
    const cached = this.cache.get(path);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    const existingInflight = this.inflight.get(path);
    if (existingInflight) return existingInflight as Promise<T>;

    const promise = this.doFetch(path, undefined, 0)
      .then((value) => {
        if (this.cacheTtlMs > 0) {
          this.cache.set(path, { value, expiresAt: Date.now() + this.cacheTtlMs });
        }
        return value as T;
      })
      .finally(() => this.inflight.delete(path));

    this.inflight.set(path, promise);
    return promise;
  }

  /** POST/mutating requests are never cached and never retried automatically
   *  beyond the 429 backoff above (retrying a POST blindly can double-submit). */
  private async requestUncached<T>(path: string, init: RequestInit): Promise<T> {
    return this.doFetch(path, init, 0) as Promise<T>;
  }

  /** Search/list active tokens tracked by Quiver (Stock Tokens, USDG, etc). */
  async getTokens(query = ""): Promise<Token[]> {
    const qs = query ? `?q=${encodeURIComponent(query)}` : "";
    const data = await this.requestCached<{ tokens: Token[] }>(`/api/tokens${qs}`);
    return data.tokens;
  }

  /** List chains supported as bridge source/destination. */
  async getChains(): Promise<Chain[]> {
    return this.requestCached<Chain[]>("/api/chains");
  }

  /**
   * Get a bridge quote. Not cached — quotes are time-sensitive by nature.
   * Note: as of this SDK's writing, only the "layerzero_stargate" route is
   * implemented server-side for most asset/chain combos — other routes may
   * return a 501 until Quiver enables them. Handle that status gracefully.
   */
  async getQuote(req: QuoteRequest): Promise<QuoteResponse> {
    return this.requestUncached<QuoteResponse>("/api/quote", {
      method: "POST",
      body: JSON.stringify(req),
    });
  }

  /** Trenches (trending new launches) for a given chain. Defaults to Robinhood
   *  Chain. Cached — this endpoint sits on top of a metered data provider, so
   *  avoid disabling the cache unless you have your own rate limiting. */
  async getTrenches(opts?: { chain?: string; types?: string[]; limit?: number }): Promise<TrenchesResponse> {
    const params = new URLSearchParams();
    if (opts?.chain) params.set("chain", opts.chain);
    if (opts?.types?.length) params.set("types", opts.types.join(","));
    if (opts?.limit) params.set("limit", String(opts.limit));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return this.requestCached<TrenchesResponse>(`/api/trenches${qs}`);
  }

  /** List launchpad (Flap-integration) tokens. */
  async getLaunchpadTokens(): Promise<LaunchpadToken[]> {
    const data = await this.requestCached<{ tokens: LaunchpadToken[] }>("/api/launchpad/tokens");
    return data.tokens;
  }

  /** Get a single launchpad token by its contract address. */
  async getLaunchpadToken(address: string): Promise<LaunchpadToken> {
    return this.requestCached<LaunchpadToken>(`/api/launchpad/token/${address}`);
  }
}
