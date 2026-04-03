import YahooFinance from "yahoo-finance2/src/index.ts";

const yf = new YahooFinance();
const result = await yf.quote("AAPL");
console.log(result.regularMarketPrice);