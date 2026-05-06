import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TOKEN;

app.use(cors());
app.use(express.json());

let latest = {
  symbol: "EURUSD",
  action: "WAIT",
  entry: 1.1000,
  sl: 1.0950,
  tp1: 1.1050,
  tp2: 1.1100,
  reason: "Bot beží"
};

let lastUpdateId = 0;

async function sendTelegram(chatId, text) {
  if (!TELEGRAM_TOKEN) return;

  await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    chat_id: chatId,
    text
  });
}

async function checkTelegramUpdates() {
  if (!TELEGRAM_TOKEN) return;

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${lastUpdateId + 1}`;
    const response = await axios.get(url);
    const updates = response.data.result || [];

    for (const update of updates) {
      lastUpdateId = update.update_id;

      const message = update.message;
      if (!message) continue;

      const chatId = message.chat.id;
      const text = message.text || "";

      if (text === "/start") {
        await sendTelegram(chatId, "Ahoj 👋 Bot beží. Použi /signal");
      }

      if (text === "/signal") {
        await sendTelegram(
          chatId,
          `📊 Signál
Symbol: ${latest.symbol}
Akcia: ${latest.action}
Entry: ${latest.entry}
SL: ${latest.sl}
TP1: ${latest.tp1}
TP2: ${latest.tp2}
Dôvod: ${latest.reason}`
        );
      }

      if (text.toLowerCase() === "ahoj") {
        await sendTelegram(chatId, "Ahoj 🙂 Bot je online.");
      }
    }
  } catch (err) {
    console.log("Telegram error:", err.message);
  }
}

async function scanMarkets() {
  console.log("Scanning markets...");

  latest = {
    symbol: "EURUSD",
    action: Math.random() > 0.5 ? "BUY" : "SELL",
    entry: 1.1000,
    sl: 1.0950,
    tp1: 1.1050,
    tp2: 1.1100,
    reason: "Testovací signál"
  };
}

app.get("/", (req, res) => {
  res.send("Bot is running 🚀");
});

app.get("/api/signals", (req, res) => {
  res.json(latest);
});

setInterval(() => scanMarkets().catch(console.error), 30000);
setInterval(() => checkTelegramUpdates().catch(console.error), 5000);

scanMarkets().catch(console.error);

app.listen(PORT, () => {
  console.log(`cTrader bot running on port ${PORT}`);
});