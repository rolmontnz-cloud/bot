import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const TOKEN_DIR = path.resolve("data");
const TOKEN_FILE = path.join(TOKEN_DIR, "token-store.json");

export function buildConnectUrl() {
  const clientId = required("CTRADER_CLIENT_ID");
  const redirectUri = required("CTRADER_REDIRECT_URI");
  const scope = process.env.CTRADER_SCOPE || "accounts";

  const url = new URL("https://id.ctrader.com/my/settings/openapi/grantingaccess/");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scope);
  url.searchParams.set("product", "web");
  return url.toString();
}

export async function exchangeCodeForToken(code) {
  const clientId = required("CTRADER_CLIENT_ID");
  const clientSecret = required("CTRADER_CLIENT_SECRET");
  const redirectUri = required("CTRADER_REDIRECT_URI");

  const url = new URL("https://openapi.ctrader.com/apps/token");
  url.searchParams.set("grant_type", "authorization_code");
  url.searchParams.set("code", code);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  });

  const data = await res.json();
  if (!res.ok || data.errorCode) {
    throw new Error(data.description || data.errorCode || `Token exchange failed: ${res.status}`);
  }

  const stored = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    tokenType: data.tokenType,
    expiresIn: data.expiresIn,
    expiresAt: Date.now() + Number(data.expiresIn || 0) * 1000,
    connectedAt: new Date().toISOString()
  };
  saveToken(stored);
  return stored;
}

export async function refreshAccessToken() {
  const current = loadToken();
  if (!current?.refreshToken) {
    throw new Error("No refresh token stored. Connect cTrader first.");
  }

  const clientId = required("CTRADER_CLIENT_ID");
  const clientSecret = required("CTRADER_CLIENT_SECRET");

  const url = new URL("https://openapi.ctrader.com/apps/token");
  url.searchParams.set("grant_type", "refresh_token");
  url.searchParams.set("refresh_token", current.refreshToken);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  });

  const data = await res.json();
  if (!res.ok || data.errorCode) {
    throw new Error(data.description || data.errorCode || `Token refresh failed: ${res.status}`);
  }

  const stored = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    tokenType: data.tokenType,
    expiresIn: data.expiresIn,
    expiresAt: Date.now() + Number(data.expiresIn || 0) * 1000,
    connectedAt: current.connectedAt,
    refreshedAt: new Date().toISOString()
  };
  saveToken(stored);
  return stored;
}

export function loadToken() {
  try {
    if (!fs.existsSync(TOKEN_FILE)) return null;
    return JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));
  } catch {
    return null;
  }
}

export function getValidAccessToken() {
  const token = loadToken();
  if (!token?.accessToken) return null;
  return token.accessToken;
}

export function getAuthStatus() {
  const token = loadToken();
  if (!token?.accessToken) {
    return { connected: false };
  }
  return {
    connected: true,
    expiresAt: token.expiresAt,
    connectedAt: token.connectedAt,
    refreshedAt: token.refreshedAt || null
  };
}

function saveToken(token) {
  if (!fs.existsSync(TOKEN_DIR)) fs.mkdirSync(TOKEN_DIR, { recursive: true });
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(token, null, 2));
}

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}
