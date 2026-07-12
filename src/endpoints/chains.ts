import type { QuvrHttpClient } from "../client.js";
import type { QuvrChain } from "../types.js";

export class ChainsApi {
  constructor(private readonly http: QuvrHttpClient) {}

  /** List source chains available for bridging into Robinhood Chain. */
  async list(): Promise<QuvrChain[]> {
    const { chains } = await this.http.get<{ chains: QuvrChain[] }>(
      "/api/chains",
    );
    return chains;
  }
}
