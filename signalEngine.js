export function buildSignal(snapshot) {
  const { price, h1Trend, m15Trend, support, resistance, atr, session } = snapshot;
  const sessionOk = session === "London" || session === "New York";
  const buffer = atr * 0.15;

  if (!sessionOk) {
    return wait("Slabá session / low volume. Radšej neobchodovať.", price);
  }

  if (h1Trend === "UP" && m15Trend === "UP") {
    if (price > resistance - buffer) {
      return {
        action: "BUY",
        entry: round(price),
        sl: round(support),
        tp1: round(price + atr * 0.8),
        tp2: round(price + atr * 1.5),
        risk: "medium",
        reason: "H1 aj M15 trend hore + cena pri breakoute rezistencie."
      };
    }
    return wait("Trend hore, ale čaká sa na pullback alebo breakout.", price);
  }

  if (h1Trend === "DOWN" && m15Trend === "DOWN") {
    if (price < support + buffer) {
      return {
        action: "SELL",
        entry: round(price),
        sl: round(resistance),
        tp1: round(price - atr * 0.8),
        tp2: round(price - atr * 1.5),
        risk: "medium",
        reason: "H1 aj M15 trend dole + cena pri breaku supportu."
      };
    }
    return wait("Trend dole, ale čaká sa na pullback alebo break supportu.", price);
  }

  return wait("H1 a M15 nesúhlasia. Bez signálu.", price);
}

function wait(reason, price) {
  return {
    action: "WAIT",
    entry: round(price),
    sl: null,
    tp1: null,
    tp2: null,
    risk: "none",
    reason
  };
}

function round(v) {
  if (v === null || v === undefined) return v;
  return Number(v.toFixed(2));
}
