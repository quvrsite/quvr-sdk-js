import type { QuvrHttpClient } from "../client.js";
import type { TickerResponse } from "../types.js";

export class TickerApi {
  constructor(private readonly http: QuvrHttpClient) {}

  /** Public live price ticker (TSLA, NVDA, SPY, USDG, ...). No auth required. */
  async get(): Promise<TickerResponse> {
    return this.http.get<TickerResponse>("/api/ticker");
  }

  /**
   * Poll the ticker on an interval and invoke `onUpdate` with each response.
   * Returns a stop() function to clear the interval.
   */
  watch(
    onUpdate: (data: TickerResponse) => void,
    onError?: (err: unknown) => void,
    intervalMs = 15_000,
  ): () => void {
    let stopped = false;

    const tick = async () => {
      if (stopped) return;
      try {
        const data = await this.get();
        if (!stopped) onUpdate(data);
      } catch (err) {
        if (!stopped && onError) onError(err);
      }
    };

    void tick();
    const handle = setInterval(tick, intervalMs);

    return () => {
      stopped = true;
      clearInterval(handle);
    };
  }
}
