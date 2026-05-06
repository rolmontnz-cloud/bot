import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let latest = {
  symbol: "EURUSD",
  action: "BUY",
  entry: 1.1000,
  sl: 1.0950,
  tp1: 1.1050,
  tp2: 1.1100,
  reason: "Trend continuation"
};

async function scanMarkets() {
  console.log("Scanning markets...");

  latest = {
    symbol: "EURUSD",
    action: Math.random() > 0.5 ? "BUY" : "SELL",
    entry: 1.1000,
    sl: 1.0950,
    tp1: 1.1050,
    tp2: 1.1100,
    reason: "Auto signal generated"
  };
}

app.get("/", (req, res) => {
  res.send("Bot is running 🚀");
});

app.get("/api/signals", (req, res) => {
  res.json(latest);
});

app.post("/api/test-telegram", async (req, res) => {
  try {
    res.json({
      ok: true,
      message: "Telegram test successful"
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

setInterval(() => scanMarkets().catch(console.error), 30000);

scanMarkets().catch(console.error);

app.listen(PORT, () => {
  console.log(`cTrader bot running on port ${PORT}`);
});