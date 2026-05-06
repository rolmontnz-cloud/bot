import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { buildConnectUrl, exchangeCodeForToken, refreshAccessToken, getAuthStatus } from "./ctraderOAuth.js";
import { getMarketSnapshot } from "./ctraderMarketClient.js";
import { buildSignal } from "./signalEngine.js";
import { sendTelegram } from "./telegram.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../../frontend")));

let latest = { updatedAt: null, symbols: {} };
const watchedSymbols = [
  process.env.SYMBOL_GOLD || "XAUUSD",
  process.env.SYMBOL_BTC || "BTCUSD"
];

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    mode: process.env.DATA_MODE || "mock",
    auth: getAuthStatus()
  });
});

app.get("/api/connect-url", (req, res) => {
  try {
    res.json({ url: buildConnectUrl() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/auth/ctrader/callback", async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) {
      return res.status(400).send("Missing OAuth code from cTrader.");
    }
    await exchangeCodeForToken(String(code));
    res.redirect("/connected.html");
  } catch (err) {
    res.status(500).send(`cTrader OAuth error: ${escapeHtml(err.message)}`);
  }
});

app.post("/api/refresh-token", async (req, res) => {
  try {
    const token = await refreshAccessToken();
    res.json({ ok: true, expiresIn: token.expiresIn });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/signals", (req, res) => {
  res.json(latest);
});

app.post("/api/test-telegram", async (req, res) => {
  try {
    await sendTelegram("✅ Test notifikácie z cTrader Auto Signal v5");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

async function scanMarkets() {
  for (const symbol of watchedSymbols) {
    const snapshot = await getMarketSnapshot(symbol);
    const signal = buildSignal(snapshot);
    const prev = latest.symbols[symbol];

    latest.symbols[symbol] = { snapshot, signal };
    latest.updatedAt = new Date().toISOString();

    const shouldNotify =
      signal.action !== "WAIT" &&
      (!prev || prev.signal.action !== signal.action || prev.signal.entry !== signal.entry);

    if (shouldNotify && process.env.ENABLE_TELEGRAM === "true") {
      await sendTelegram(formatSignalMessage(symbol, signal, snapshot));
    }
  }
}

function formatSignalMessage(symbol, signal, snapshot) {
  return [
    `🔔 ${symbol} ${signal.action} setup`,
    `Cena: ${snapshot.price}`,
    `Zdroj: ${snapshot.source}`,
    `H1 trend: ${snapshot.h1Trend}`,
    `M15 trend: ${snapshot.m15Trend}`,
    `Entry: ${signal.entry}`,
    `SL: ${signal.sl}`,
    `TP1: ${signal.tp1}`,
    `TP2: ${signal.tp2}`,
    `Dôvod: ${signal.reason}`,
    `Session: ${snapshot.session}`
  ].join("\n");
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

setInterval(() => scanMarkets().catch(console.error), 30_000);
scanMarkets().catch(console.error);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Bot is running 🚀");
});