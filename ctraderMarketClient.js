import dotenv from "dotenv";
import { getValidAccessToken } from "./ctraderOAuth.js";
dotenv.config();

export async function getMarketSnapshot(symbol) {
  const mode = process.env.DATA_MODE || "mock";

  if (mode === "ctrader") {
    return getCTraderMarketSnapshot(symbol);
  }

  return getMockSnapshot(symbol);
}

async function getCTraderMarketSnapshot(symbol) {
  const accessToken = getValidAccessToken();
  if (!accessToken) {
    throw new Error("cTrader is not connected. Open the app and click Connect cTrader.");
  }

  /**
   * NEXT IMPLEMENTATION STEP:
   *
   * After OAuth, cTrader market data requires Open API socket/ProtoBuf workflow:
   * - ProtoOAApplicationAuthReq with clientId/clientSecret
   * - ProtoOAGetAccountListByAccessTokenReq with accessToken
   * - ProtoOAAccountAuthReq with selected account
   * - symbol lookup
   * - spot subscription
   * - H1/M15 trend calculation from bars
   *
   * The OAuth part is automatic now. This method is the exact place to add the live feed.
   */
  throw new Error("cTrader OAuth is connected, but live market socket is not implemented yet.");
}

function getMockSnapshot(symbol) {
  const now = new Date();
  const hour = now.getUTCHours();

  const session =
    hour >= 7 && hour < 10 ? "London" :
    hour >= 12 && hour < 16 ? "New York" :
    "Low volume";

  const base = symbol.includes("BTC") ? 81200 : 4560;
  const noise = Math.sin(Date.now() / 60000) * (symbol.includes("BTC") ? 80 : 3);
  const price = Number((base + noise).toFixed(symbol.includes("BTC") ? 0 : 2));
  const up = Math.sin(Date.now() / 180000) > 0;

  return {
    symbol,
    price,
    h1Trend: up ? "UP" : "DOWN",
    m15Trend: up ? "UP" : "DOWN",
    support: Number((price - (symbol.includes("BTC") ? 250 : 6)).toFixed(2)),
    resistance: Number((price + (symbol.includes("BTC") ? 250 : 6)).toFixed(2)),
    atr: symbol.includes("BTC") ? 180 : 8,
    session,
    source: "mock",
    time: new Date().toISOString()
  };
}
