# @quvrsite/sdk

Community-maintained TypeScript/JavaScript client for the [QUVR](https://quvr.site) public API — a bridge aggregator and stock token / USDG watchlist for **Robinhood Chain** (Chain ID `4663`).

This SDK wraps QUVR's Next.js API routes (`/api/tokens`, `/api/chains`, `/api/quote`, `/api/ticker`, `/api/watchlist`, `/api/portfolio`, `/api/waitlist`) so you can build bots, dashboards, and integrations on top of QUVR without re-implementing HTTP plumbing by hand.

- Website: https://quvr.site
- Twitter/X: https://x.com/QUVRsite
- Org: https://github.com/quvrsite

## Install

```bash
npm install @quvrsite/sdk
```

## Quick start

```ts
import { QuvrClient } from "@quvrsite/sdk";

const quvr = new QuvrClient();

const { prices } = await quvr.ticker.get();
console.log(prices); // TSLA, NVDA, SPY, USDG live prices

const tokens = await quvr.tokens.search("TSLA");
const chains = await quvr.chains.list();
```

### Getting a bridge quote

```ts
const quote = await quvr.bridge.quote({
  srcChainId: 42161, // Arbitrum
  dstChainId: 4663,  // Robinhood Chain
  tokenSymbol: "USDC",
  amount: "1000000000000000000",
  recipientAddress: "0xYourAddress",
  route: "layerzero_stargate",
});
```

### Authenticated endpoints

Watchlists, portfolio, and bridge-initiate require a logged-in session (QUVR uses Sign-In With Ethereum). Pass the session cookie captured from the browser when calling these server-side:

```ts
const quvr = new QuvrClient({ authHeader: "sb-access-token=...; other-cookie=..." });
const watchlists = await quvr.watchlist.list();
const portfolio = await quvr.portfolio.get();
```

### Live-polling the ticker

```ts
const stop = quvr.ticker.watch(
  (data) => console.log("update:", data.prices),
  (err) => console.error("ticker error:", err),
  15_000, // poll every 15s
);

// later
stop();
```

## Configuration

```ts
new QuvrClient({
  baseUrl: "https://quvr.site", // point at a self-hosted / staging deployment
  authHeader: undefined,        // optional session cookie for authed routes
  timeoutMs: 10_000,
  fetchImpl: fetch,              // inject a custom fetch (Node <18, tests, etc.)
});
```

## Development

```bash
npm install
npm run build     # compile to dist/
npm run example   # run examples/basic.ts against the live API
```

## Disclaimer

This is an **unofficial, community-built** client based on QUVR's publicly observable API surface. Response shapes may change without notice — if something breaks, please open an issue or PR.

## License

MIT
