# @quiver/sdk

Official TypeScript SDK for [Quiver](https://quvr.site) — bridge quotes for Robinhood
Chain, Stock Token / USDG token data, Trenches trending data, and Launchpad tokens.

This SDK talks to Quiver's **public** API routes only. Endpoints that operate on a
specific user's own data (watchlist, portfolio, price alerts) require a SIWE session
cookie issued by the Quiver web app and are intentionally **not** exposed here — don't
try to hold a user's session token client-side in a public package.

> ⚠️ **Status: community/companion SDK, work in progress.** Verify response shapes
> against the live API before shipping to production — Quiver's API is not yet
> versioned, so field names may change without notice until a stable `v1` is announced.

## Install

```bash
npm install @quiver/sdk
```

## Usage

```ts
import { QuiverClient } from "@quiver/sdk";

const quiver = new QuiverClient({ baseUrl: "https://quvr.site" });

const tokens = await quiver.getTokens("TSLA");
const trenches = await quiver.getTrenches({ limit: 10 });

const quote = await quiver.getQuote({
  srcChainId: 42161, // Arbitrum
  dstChainId: 4663, // Robinhood Chain
  tokenSymbol: "USDC",
  amount: "1000000",
  recipientAddress: "0xYourAddress",
  route: "layerzero_stargate",
});
```

See [`examples/basic-usage.ts`](./examples/basic-usage.ts) for a runnable example.

## API surface

| Method | Endpoint | Notes |
|---|---|---|
| `getTokens(query?)` | `GET /api/tokens` | Search active tokens by symbol |
| `getChains()` | `GET /api/chains` | Supported bridge source/destination chains |
| `getQuote(req)` | `POST /api/quote` | Only `layerzero_stargate` is guaranteed live; other routes may 501 |
| `getTrenches(opts?)` | `GET /api/trenches` | Defaults to Robinhood Chain |
| `getLaunchpadTokens()` | `GET /api/launchpad/tokens` | |
| `getLaunchpadToken(address)` | `GET /api/launchpad/token/:address` | |

## Safe by default

This SDK is deliberately conservative about hitting Quiver's API:

- **GET requests are cached in-memory for 20s by default** (`cacheTtlMs`), and concurrent
  calls for the same path are de-duplicated into one in-flight request. This matters because
  `getTrenches()` sits on top of a metered third-party data provider on Quiver's backend —
  every consumer of this SDK (widget, CLI, bot) inherits this protection automatically.
- **429 responses trigger exponential backoff** (up to `maxRetriesOn429`, default 2) instead
  of an immediate retry storm.
- **Reuse one `QuiverClient` instance** per process/app instead of creating a new one per
  request — a fresh instance means a fresh (empty) cache, which defeats the point.

You can tune or disable this:

```ts
const quiver = new QuiverClient({
  baseUrl: "https://quvr.site",
  cacheTtlMs: 60_000, // cache GETs for 60s instead of 20s
  maxRetriesOn429: 0, // disable retry-on-429 (not recommended for polling use cases)
});
```

If you're building something that polls automatically (a widget, a bot, a dashboard),
please don't set `cacheTtlMs: 0` unless you've added your own rate limiting — it turns
every one of your users into direct load on Quiver's backend and, transitively, its
upstream data providers.

## Error handling

All non-2xx responses throw `QuiverApiError` with `.status` and `.body`. The `/api/quote`
route returns `501` for routes Quiver hasn't wired up yet (e.g. canonical bridge, CCIP) —
handle that status explicitly instead of treating it as a generic failure.

## Development

```bash
npm install
npm run build      # bundles to dist/ via tsup
npm run typecheck
```

## Disclaimer

This is a companion tool for the Quiver ecosystem, published independently of the main
`quvrsite` app repo. Always double-check bridge quotes and contract addresses against
[docs.robinhood.com/chain/contracts](https://docs.robinhood.com/chain/contracts) before
moving real funds — this SDK does not validate on-chain contract addresses for you.

## License

MIT
