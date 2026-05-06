const API_BASE = localStorage.getItem("API_BASE") || "";

document.getElementById("connect").addEventListener("click", async () => {
  const res = await fetch(`${API_BASE}/api/connect-url`);
  const data = await res.json();
  if (data.url) {
    window.location.href = data.url;
  } else {
    alert(data.error || "Connect URL error");
  }
});

document.getElementById("refresh").addEventListener("click", async () => {
  const res = await fetch(`${API_BASE}/api/refresh-token`, { method: "POST" });
  const data = await res.json();
  alert(data.ok ? "Token refreshed" : data.error);
  loadHealth();
});

async function loadHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    const data = await res.json();
    document.getElementById("backend").textContent = data.ok ? "online" : "error";
    document.getElementById("mode").textContent = data.mode;
    document.getElementById("auth").textContent = data.auth?.connected ? "connected" : "not connected";
  } catch (e) {
    document.getElementById("backend").textContent = "offline";
  }
}

async function loadSignals() {
  try {
    const res = await fetch(`${API_BASE}/api/signals`);
    const data = await res.json();
    document.getElementById("updated").textContent = data.updatedAt ? new Date(data.updatedAt).toLocaleTimeString() : "-";
    renderCards(data.symbols || {});
  } catch (e) {
    renderCards({});
  }
}

function renderCards(symbols) {
  const root = document.getElementById("cards");
  const entries = Object.entries(symbols);
  if (!entries.length) {
    root.innerHTML = `<div class="card">Žiadne dáta. Backend ešte nenačítal trh.</div>`;
    return;
  }

  root.innerHTML = entries.map(([symbol, data]) => {
    const s = data.snapshot;
    const sig = data.signal;
    return `
      <article class="card">
        <h2>${symbol} <span class="badge ${sig.action}">${sig.action}</span></h2>
        <div class="grid">
          ${item("Cena", s.price)}
          ${item("Session", s.session)}
          ${item("H1", s.h1Trend)}
          ${item("M15", s.m15Trend)}
          ${item("Entry", sig.entry)}
          ${item("SL", sig.sl ?? "-")}
          ${item("TP1", sig.tp1 ?? "-")}
          ${item("TP2", sig.tp2 ?? "-")}
        </div>
        <p class="reason">${sig.reason}</p>
        <p class="label">Zdroj: ${s.source} | ${new Date(s.time).toLocaleString()}</p>
      </article>
    `;
  }).join("");
}

function item(label, value) {
  return `<div class="item"><div class="label">${label}</div><div class="value">${value}</div></div>`;
}

loadHealth();
loadSignals();
setInterval(loadSignals, 5000);
