import type { QuvrHttpClient } from "../client.js";
import type { QuvrToken } from "../types.js";

export class TokensApi {
  constructor(private readonly http: QuvrHttpClient) {}

  /**
   * Search active tokens (stock tokens, USDG, etc.) by symbol.
   * Mirrors GET /api/tokens?q=
   */
  async search(query = ""): Promise<QuvrToken[]> {
    const qs = query ? `?q=${encodeURIComponent(query)}` : "";
    const { tokens } = await this.http.get<{ tokens: QuvrToken[] }>(
      `/api/tokens${qs}`,
    );
    return tokens;
  }
}
