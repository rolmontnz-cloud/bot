app.post("/webhook", async (req, res) => {
  try {
    const data = req.body;

    latest = {
      symbol: data.symbol || "UNKNOWN",
      action: data.action || "WAIT",
      entry: data.entry || "-",
      sl: data.sl || "-",
      tp1: data.tp1 || "-",
      tp2: data.tp2 || "-",
      reason: data.reason || "TradingView alert"
    };

    const text = `📊 Nový signál
Symbol: ${latest.symbol}
Akcia: ${latest.action}
Entry: ${latest.entry}
SL: ${latest.sl}
TP1: ${latest.tp1}
TP2: ${latest.tp2}
Dôvod: ${latest.reason}`;

    if (data.chatId) {
      await sendTelegram(data.chatId, text);
    }

    res.json({ ok: true, signal: latest });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});