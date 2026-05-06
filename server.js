const express = require("express");
const axios = require("axios");

const app = express();

const PORT = process.env.PORT || 10000;
const TELEGRAM_TOKEN = process.env.TOKEN;

let lastUpdateId = 0;

app.get("/", (req, res) => {
  res.send("Bot is running 🚀");
});

async function sendTelegramMessage(chatId, text) {
  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: text,
      }
    );
  } catch (error) {
    console.log("Telegram send error:", error.message);
  }
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
        await sendTelegramMessage(
          chatId,
          "Ahoj 👋 Bot beží. Použi /signal"
        );
      }

      if (text === "/signal") {
        const signalText = `
📊 Signál

Symbol: EURUSD
Akcia: BUY
Entry: 1.1000
SL: 1.0950
TP1: 1.1050
TP2: 1.1100

Dôvod: Testovací signál
`;

        await sendTelegramMessage(chatId, signalText);
      }
    }
  } catch (error) {
    console.log("Update error:", error.message);
  }
}

setInterval(checkTelegramUpdates, 3000);

app.listen(PORT, () => {
  console.log(`cTrader bot running on port ${PORT}`);
});