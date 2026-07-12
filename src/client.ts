import type { QuvrApiError } from "./types.js";

export interface QuvrClientOptions {
  /** Base URL of the QUVR deployment. Defaults to the public production site. */
  baseUrl?: string;
  /**
   * Optional session cookie / auth header for endpoints that require a
   * logged-in user (watchlist, portfolio, alerts, bridge initiate).
   * QUVR uses Sign-In With Ethereum (SIWE) session cookies, so in a
   * server-side context you'd typically forward the `Cookie` header
   * captured from the browser session.
   */
  authHeader?: string;
  /** Custom fetch implementation (useful for Node < 18, or testing). */
  fetchImpl?: typeof fetch;
  /** Request timeout in milliseconds. Defaults to 10s. */
  timeoutMs?: number;
}

export class QuvrApiRequestError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "QuvrApiRequestError";
    this.status = status;
    this.body = body;
  }
}

const DEFAULT_BASE_URL = "https://quvr.site";
const DEFAULT_TIMEOUT_MS = 10_000;

export class QuvrHttpClient {
  private readonly baseUrl: string;
  private readonly authHeader?: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: QuvrClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.authHeader = options.authHeader;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string> | undefined),
    };
    if (this.authHeader) {
      headers["Cookie"] = this.authHeader;
    }

    try {
      const res = await this.fetchImpl(url, {
        ...init,
        headers,
        signal: controller.signal,
      });

      const isJson = res.headers
        .get("content-type")
        ?.includes("application/json");
      const body = isJson ? await res.json() : await res.text();

      if (!res.ok) {
        const err = body as QuvrApiError;
        const message =
          typeof err?.error === "string"
            ? err.error
            : `QUVR API request failed with status ${res.status}`;
        throw new QuvrApiRequestError(message, res.status, body);
      }

      return body as T;
    } finally {
      clearTimeout(timer);
    }
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  post<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }
}
