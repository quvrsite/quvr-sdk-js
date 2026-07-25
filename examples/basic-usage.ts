import { QuiverClient, QuiverApiError } from "../src/index.js";

const quiver = new QuiverClient({ baseUrl: "https://quvr.site" });

async function main() {
  const tokens = await quiver.getTokens("TSLA");
  console.log("Tokens:", tokens);

  const trenches = await quiver.getTrenches({ limit: 10 });
  console.log("Trenches:", trenches.tokens?.length ?? 0, "tokens");

  try {
    const quote = await quiver.getQuote({
      srcChainId: 42161,
      dstChainId: 4663,
      tokenSymbol: "USDC",
      amount: "1000000",
      recipientAddress: "0x0000000000000000000000000000000000dEaD",
      route: "layerzero_stargate",
    });
    console.log("Quote:", quote);
  } catch (err) {
    if (err instanceof QuiverApiError && err.status === 501) {
      console.log("This route isn't live yet on Quiver's side.");
    } else {
      throw err;
    }
  }
}

main().catch(console.error);
