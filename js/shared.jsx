// shared.jsx — global helpers exposed on window

const { useState, useEffect, useMemo, useRef, useCallback } = React;

// Simple hash router with optional query: #/admin/timeline?side=seller
function useRoute() {
  const [hash, setHash] = useState(window.location.hash || "#/login");
  useEffect(() => {
    const h = () => setHash(window.location.hash || "#/login");
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);
  const raw = hash.replace(/^#/, "");
  const [path, queryStr = ""] = raw.split("?");
  const query = {};
  queryStr.split("&").filter(Boolean).forEach(kv => {
    const [k, v = ""] = kv.split("=");
    query[decodeURIComponent(k)] = decodeURIComponent(v);
  });
  const go = (r, q) => {
    if (q && Object.keys(q).length) {
      const qs = Object.entries(q).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
      window.location.hash = `${r}?${qs}`;
    } else {
      window.location.hash = r;
    }
  };
  return [path, go, query];
}

function cx(...xs) { return xs.filter(Boolean).join(" "); }

// Status chip
function Chip({ tone = "ink", dot = false, children }) {
  return <span className={cx("chip", `chip-${tone}`, dot && "chip-dot")}>{children}</span>;
}

// Generic card
function Card({ accent = false, dark = false, className = "", children, style }) {
  return <div className={cx("card", accent && "card-accent", dark && "card-dark", className)} style={style}>{children}</div>;
}

// Property placeholder (SVG, no images)
function PropertyPlaceholder({ variant = 0, label }) {
  const palettes = [
    ["#2b3e4f", "#456276", "#7a9fbc"],
    ["#3a2c27", "#6b4a3e", "#b5876b"],
    ["#1d3a2f", "#2f604d", "#6ca28a"],
    ["#3b3146", "#5d4b6e", "#9a85b0"],
    ["#3d2b2c", "#744245", "#c67a80"]
  ];
  const [a, b, c] = palettes[variant % palettes.length];
  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" style={{ display: "block", width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id={`sky${variant}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={c} stopOpacity="0.6" />
          <stop offset="1" stopColor={a} />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill={`url(#sky${variant})`} />
      {/* distant mountains */}
      <path d={`M0 170 L60 140 L120 160 L200 120 L280 150 L340 130 L400 160 L400 260 L0 260 Z`} fill={b} opacity="0.7" />
      <path d={`M0 200 L80 175 L160 195 L240 170 L320 195 L400 180 L400 260 L0 260 Z`} fill={a} opacity="0.85" />
      {/* house silhouette */}
      <g transform="translate(140 140)">
        <path d="M0 60 L0 30 L60 0 L120 30 L120 60 Z" fill="#fff" opacity="0.92" />
        <rect x="48" y="30" width="24" height="30" fill={a} />
        <rect x="12" y="32" width="14" height="12" fill={c} opacity="0.7" />
        <rect x="94" y="32" width="14" height="12" fill={c} opacity="0.7" />
      </g>
      {/* palm */}
      <g transform="translate(40 120)" opacity="0.85">
        <rect x="8" y="20" width="4" height="80" fill="#2a1a12" />
        <path d="M10 22 Q-10 10 -20 25 Q-5 15 10 22" fill="#1d3a2f" />
        <path d="M10 22 Q30 8 42 20 Q24 12 10 22" fill="#1d3a2f" />
        <path d="M10 22 Q5 0 20 -6 Q14 8 10 22" fill="#1d3a2f" />
        <path d="M10 22 Q0 4 -12 -2 Q2 6 10 22" fill="#1d3a2f" />
      </g>
      {label && <text x="200" y="252" textAnchor="middle" fontSize="10" fontFamily="Raleway" fontWeight="700" letterSpacing="2" fill="#fff" opacity="0.8">{label}</text>}
    </svg>
  );
}

// Tiny checkbox/toggle
function Check({ checked, onChange, tone = "red" }) {
  return (
    <button onClick={() => onChange(!checked)} style={{
      width: 18, height: 18, borderRadius: 4,
      border: `1.5px solid ${checked ? "var(--red)" : "#C9C5C0"}`,
      background: checked ? "var(--red)" : "#fff",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, transition: "all 0.12s"
    }}>
      {checked && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6 L5 9 L10 3" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </button>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 40, height: 22, borderRadius: 100,
      background: on ? "var(--red)" : "#D9D6D2",
      position: "relative", transition: "background 0.15s", flexShrink: 0
    }}>
      <span style={{
        position: "absolute", top: 2, left: on ? 20 : 2,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        transition: "left 0.15s", boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
      }} />
    </button>
  );
}

// Onward signoff
function Onward({ color = "var(--ink)" }) {
  return <span className="h-serif" style={{ fontStyle: "italic", color, fontSize: 20 }}>Onward.</span>;
}

// ─── USERS & AUTH (prototype — replace with real auth before production) ───
// Frontend-only credentials check. Passwords live in plain JS and source is
// visible. Before launch: wire Firebase Auth / Supabase / magic-link.
const USERS = [
  {
    email: "kristina@uluteam.com",
    name: "Kristina Ulu",
    initials: "KU",
    role: "Transaction Coordinator",
    avatar: "linear-gradient(135deg, #B32025, #6B1316)"
  },
  {
    email: "daniel@uluteam.com",
    name: "Daniel Ulu",
    initials: "DU",
    role: "Team Leader",
    avatar: "linear-gradient(135deg, #C79A2D, #8A6A18)"
  },
  {
    email: "info@uluteam.com",
    name: "Ulu Team Admin",
    initials: "UA",
    role: "Admin · Oversight",
    avatar: "linear-gradient(135deg, #14110F, #2A2624)"
  }
];

// Demo passwords — change these in production OR migrate to real auth.
const PASSWORDS = {
  "kristina@uluteam.com": "kristina2026",
  "daniel@uluteam.com": "daniel2026",
  "info@uluteam.com": "ulu2026"
};

const SESSION_KEY = "ulu_session_v1";

function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}
function getCurrentUser() {
  const s = getSession();
  if (!s) return null;
  return USERS.find(u => u.email === s.email) || null;
}
function isSignedIn() { return !!getSession(); }
function signIn(email, password, remember = true) {
  const u = USERS.find(x => x.email.toLowerCase() === String(email).toLowerCase().trim());
  if (!u) return { ok: false, error: "Email not recognized." };
  if (PASSWORDS[u.email] !== password) return { ok: false, error: "Incorrect password." };
  const session = { email: u.email, signedInAt: Date.now() };
  const store = remember ? localStorage : sessionStorage;
  store.setItem(SESSION_KEY, JSON.stringify(session));
  return { ok: true, user: u };
}
function signOut() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

// ─── TRANSACTION STORE ────────────────────────────────────────────────────
// Persistent storage backed by server API (/api/transactions).
// Keeps a local in-memory cache for synchronous reads (dashboard, editor)
// and syncs every mutation to the database via async API calls.
const _txCache = {};
let _txCacheReady = false;

function _normalizeRow(row) {
  return {
    id: row.id,
    buyer: row.buyer || null,
    seller: row.seller || null,
    createdAt: row.created_at ? new Date(row.created_at).getTime()
             : row.createdAt  ? (typeof row.createdAt === "number" ? row.createdAt : new Date(row.createdAt).getTime())
             : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime()
             : row.updatedAt  ? (typeof row.updatedAt === "number" ? row.updatedAt : new Date(row.updatedAt).getTime())
             : Date.now(),
  };
}

const transactionStore = {
  async fetchAll() {
    try {
      const res = await fetch("/api/transactions");
      if (!res.ok) return;
      const rows = await res.json();
      for (const key of Object.keys(_txCache)) delete _txCache[key];
      for (const row of rows) {
        const n = _normalizeRow(row);
        _txCache[n.id] = n;
      }
    } catch (e) { console.warn("Failed to fetch transactions:", e); }
    _txCacheReady = true;
  },

  list() {
    return Object.values(_txCache).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  },

  get(id) {
    return _txCache[id] || null;
  },

  save(id, partial) {
    const existing = _txCache[id] || { id, createdAt: Date.now() };
    const merged = { ...existing, ...partial, id, updatedAt: Date.now() };
    _txCache[id] = merged;
    fetch("/api/transactions?id=" + encodeURIComponent(id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyer: merged.buyer, seller: merged.seller }),
    }).catch(e => console.warn("Save failed:", e));
    return merged;
  },

  create(seed = {}) {
    const id = "tx_" + Math.random().toString(36).slice(2, 9);
    const now = Date.now();
    const row = { id, buyer: seed.buyer || null, seller: seed.seller || null, createdAt: now, updatedAt: now };
    _txCache[id] = row;
    fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    }).catch(e => console.warn("Create failed:", e));
    return row;
  },

  duplicate(id) {
    const src = this.get(id);
    if (!src) return null;
    const copy = JSON.parse(JSON.stringify(src));
    delete copy.id;
    delete copy.createdAt;
    delete copy.updatedAt;
    return this.create(copy);
  },

  remove(id) {
    delete _txCache[id];
    fetch("/api/transactions?id=" + encodeURIComponent(id), { method: "DELETE" })
      .catch(e => console.warn("Delete failed:", e));
  },

  exportAll() {
    return JSON.stringify(_txCache, null, 2);
  },

  isReady() { return _txCacheReady; },
};

Object.assign(window, {
  useState, useEffect, useMemo, useRef, useCallback,
  useRoute, cx, Chip, Card, PropertyPlaceholder, Check, Toggle, Onward,
  USERS, PASSWORDS, getCurrentUser, isSignedIn, signIn, signOut,
  transactionStore
});
