import { QuvrClient } from "../src/index.js";

async function main() {
  const quvr = new QuvrClient({
    // baseUrl: "https://quvr.site", // default, override for local dev
  });

  console.log("Fetching live ticker...");
  const { prices } = await quvr.ticker.get();
  for (const p of prices) {
    console.log(`${p.symbol}: $${p.priceUsd} (${p.tone})`);
  }

  console.log("\nSearching tokens matching 'TS'...");
  const tokens = await quvr.tokens.search("TS");
  console.log(tokens);

  console.log("\nListing bridge source chains...");
  const chains = await quvr.chains.list();
  console.log(chains);
}

main().catch((err) => {
  console.error("Example failed:", err);
  process.exit(1);
});
