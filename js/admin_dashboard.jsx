// admin_dashboard.jsx — live transaction list from transactionStore

function AdminShell({ children, go }) {
  const user = getCurrentUser();
  const firstName = user ? (user.name || "").split(" ")[0] : "";
  return (
    <div style={{ minHeight: "100vh", background: "#EDEBE7", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid var(--line)", padding: "18px 32px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div className="eyebrow" style={{ fontSize: 10, color: "var(--ink-4)" }}>Transaction Manager</div>
          <div style={{ fontFamily: "var(--sans)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.015em", color: "var(--ink)", marginTop: 2 }}>
            Timelines
          </div>
        </div>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "right" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1.2 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--ink-4)" }}>Welcome back</div>
              <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 20, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.005em", marginTop: 2 }}>
                {firstName || user.name}
              </div>
            </div>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: user.avatar, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 13, letterSpacing: 0.5, flexShrink: 0
            }}>
              {user.initials}
            </div>
          </div>
        )}
      </div>
      {children}
      <div style={{ background: "#fff", borderTop: "1px solid var(--line)", padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--ink-4)" }}>
        <span>© 2026 The Ulu Team · Keller Williams Honolulu (RB-21303)</span>
        <Onward color="var(--red)" />
      </div>
    </div>
  );
}

const TODAY = new Date();
function daysBetween(target) {
  const t = parseDate(target);
  if (!t) return null;
  t.setHours(0, 0, 0, 0);
  const t0 = new Date(TODAY); t0.setHours(0, 0, 0, 0);
  return Math.round((t - t0) / 86400000);
}
function parseDate(str) {
  if (!str) return null;
  const s = String(str).trim();
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) { let [, mo, d, y] = m; y = +y; if (y < 100) y += 2000; const dt = new Date(+y, +mo - 1, +d); return isNaN(dt.getTime()) ? null : dt; }
  const t = new Date(s);
  return isNaN(t.getTime()) ? null : t;
}

// Pull "next deadline" from a saved transaction's buyer-side sections.
function findNextDeadline(side) {
  if (!side || !side.sections) return null;
  let best = null;
  for (const sec of side.sections) {
    for (const r of sec.rows) {
      if (r.done) continue;
      if (r.basis === "attached") continue;
      const d = parseDate(r.due);
      if (!d) continue;
      const days = daysBetween(r.due);
      if (days === null) continue;
      if (best === null || days < best.daysFrom) {
        best = { term: r.term, label: r.desc, date: r.due, daysFrom: days };
      }
    }
  }
  return best;
}

// Convert a stored tx into the lightweight shape the dashboard renders.
function deriveCardData(tx) {
  const b = tx.buyer || {};
  const s = tx.seller || {};
  // Use whichever side has more filled-in data as primary
  const sideKey = (s.property && !b.property) ? "seller" : "buyer";
  const primary = sideKey === "seller" ? s : b;
  const opposing = sideKey === "seller" ? b : s;

  // Client name from parties of the same side
  const principalRole = sideKey === "seller" ? "seller" : "buyer";
  const clientParts = (primary.parties || []).filter(p => p.role === principalRole && p.name).map(p => p.name);
  const client = clientParts.join(" & ") || "—";

  const closing = primary.closing || opposing.closing || "";
  const accept  = primary.acceptance || opposing.acceptance || "";
  const days = closing ? daysBetween(closing) : null;
  const closed = primary.sections?.some(sec => sec.rows.some(r => r.term === "F-2" && r.done));

  const nextDeadline = findNextDeadline(primary);
  const hasOverdue = nextDeadline && nextDeadline.daysFrom < 0 && !closed;

  // Updated label
  const updatedTs = tx.updatedAt;
  const ageMins = updatedTs ? Math.round((Date.now() - updatedTs) / 60000) : null;
  let updated = "—";
  if (ageMins != null) {
    if (ageMins < 1) updated = "Just now";
    else if (ageMins < 60) updated = `${ageMins}m ago`;
    else if (ageMins < 60 * 24) updated = `${Math.round(ageMins / 60)}h ago`;
    else if (ageMins < 60 * 24 * 2) updated = "Yesterday";
    else updated = new Date(updatedTs).toLocaleDateString();
  }

  return {
    id: tx.id,
    side: sideKey,
    addr: primary.property || "Untitled transaction",
    client,
    leadAgent: primary.leadAgent,
    accept, close: closing,
    daysToClose: closed ? -999 : (days == null ? 999 : days),
    closed,
    hasOverdue,
    nextDeadline,
    updated, updatedTs
  };
}

function statusFor(t) {
  if (t.closed) return { key: "closed", label: "Closed", color: "var(--ink-4)", bg: "#F1EFEC", priority: 999 };
  if (t.daysToClose < 0) return { key: "past-due", label: "Past Due", color: "var(--red)", bg: "var(--red-wash)", priority: 0, pulse: true };
  if (t.hasOverdue) return { key: "overdue", label: "Deadline Overdue", color: "var(--red)", bg: "var(--red-wash)", priority: 1, pulse: true };
  if (t.daysToClose <= 7) return { key: "urgent", label: "Urgent", color: "var(--red)", bg: "var(--red-wash)", priority: 2 };
  if (t.daysToClose <= 14) return { key: "this-week", label: "This Week", color: "var(--amber)", bg: "var(--amber-wash)", priority: 3 };
  if (t.daysToClose <= 30) return { key: "active", label: "On Track", color: "var(--green)", bg: "var(--green-wash)", priority: 4 };
  if (t.daysToClose >= 998) return { key: "blank", label: "Not Started", color: "var(--ink-4)", bg: "#F1EFEC", priority: 6 };
  return { key: "future", label: "Early Stage", color: "var(--ink-3)", bg: "#F1EFEC", priority: 5 };
}

function AdminDashboard({ go }) {
  const [leadFilter, setLeadFilter] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("closing");
  const [query, setQuery] = React.useState("");
  const [version, setVersion] = React.useState(0); // bump to refetch
  const refresh = () => setVersion(v => v + 1);

  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    transactionStore.fetchAll().then(() => {
      if (transactionStore.list().length === 0) seedDemoData();
      setLoading(false);
      refresh();
    });
  }, []);

  const rawList = React.useMemo(() => transactionStore.list().map(deriveCardData), [version]);
  const leadAgents = Array.from(new Set(rawList.map(t => t.leadAgent).filter(Boolean))).sort();

  const filtered = rawList
    .filter(t => leadFilter === "all" || t.leadAgent === leadFilter)
    .filter(t => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (t.addr || "").toLowerCase().includes(q)
          || (t.client || "").toLowerCase().includes(q)
          || (t.leadAgent || "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === "updated") return (b.updatedTs || 0) - (a.updatedTs || 0);
      const sa = statusFor(a); const sb = statusFor(b);
      if (sa.priority !== sb.priority) return sa.priority - sb.priority;
      return a.daysToClose - b.daysToClose;
    });

  const counts = rawList.reduce((acc, t) => {
    const k = statusFor(t).key;
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const handleNew = () => {
    const tx = transactionStore.create({
      buyer: window.getInitialSideState ? window.getInitialSideState("buyer") : {},
      seller: window.getInitialSideState ? window.getInitialSideState("seller") : {}
    });
    go("/admin/timeline", { id: tx.id });
  };

  const handleDuplicate = (id) => {
    const dup = transactionStore.duplicate(id);
    if (dup) refresh();
  };

  const handleDelete = (id, label) => {
    if (!window.confirm(`Delete the timeline for "${label}"? This cannot be undone.`)) return;
    transactionStore.remove(id);
    refresh();
  };

  const handleExportJSON = () => {
    const data = transactionStore.exportAll();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ulu-timelines-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell go={go}>
      <div style={{ flex: 1, padding: "28px 32px 40px", maxWidth: 1400, margin: "0 auto", width: "100%" }}>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }} className="tl-grid-3">
          <SummaryTile color="var(--red)" count={(counts["past-due"] || 0) + (counts["overdue"] || 0)} label="Needs Attention" sub="Past due or overdue deadline" pulse />
          <SummaryTile color="var(--red)" count={counts["urgent"] || 0} label="Closing ≤ 7 days" sub="Final stretch" />
          <SummaryTile color="var(--amber)" count={counts["this-week"] || 0} label="Closing 8–14 days" sub="Coming up" />
          <SummaryTile color="var(--green)" count={(counts["active"] || 0) + (counts["future"] || 0)} label="On track" sub="≥ 15 days out" />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 420 }}>
              <Icon name="search" size={16} style={{ position: "absolute", left: 12, top: 12, color: "var(--ink-4)" }} />
              <input
                className="input"
                placeholder="Search by property, client, or lead agent…"
                style={{ paddingLeft: 38 }}
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <select className="input" style={{ width: 200 }} value={leadFilter} onChange={e => setLeadFilter(e.target.value)}>
              <option value="all">Lead: All agents</option>
              {leadAgents.map(a => <option key={a} value={a}>Lead: {a}</option>)}
            </select>
            <select className="input" style={{ width: 220 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="closing">Sort: Upcoming closing</option>
              <option value="updated">Sort: Recently updated</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={handleExportJSON} title="Download a JSON backup of all timelines"><Icon name="download" size={12} /> Export</button>
            <button className="btn btn-red" onClick={handleNew}><Icon name="plus" size={14} /> New Timeline</button>
          </div>
        </div>

        {loading && (
          <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: "44px 24px", textAlign: "center", color: "var(--ink-3)" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-2)" }}>Loading timelines...</div>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ background: "#fff", border: "1px dashed var(--line)", borderRadius: 10, padding: "44px 24px", textAlign: "center", color: "var(--ink-3)" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-2)" }}>
              {rawList.length === 0 ? "No timelines yet" : "No timelines match your filters"}
            </div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {rawList.length === 0
                ? "Click \"New Timeline\" to get started."
                : "Try clearing the search or changing the lead filter."}
            </div>
          </div>
        )}

        <div className="col" style={{ gap: 10 }}>
          {filtered.map(t => (
            <TimelineCard
              key={t.id}
              t={t}
              go={go}
              onDuplicate={() => handleDuplicate(t.id)}
              onDelete={() => handleDelete(t.id, t.addr)}
            />
          ))}
        </div>

        {/* Footer note re: production hosting */}
        <div style={{ marginTop: 32, padding: "14px 18px", background: "#FBF8F3", border: "1px solid var(--line)", borderRadius: 8, fontSize: 11.5, color: "var(--ink-4)", lineHeight: 1.55 }}>
          <strong style={{ color: "var(--ink-3)" }}>Storage:</strong> Timelines are saved to the server database and synced across all devices and users.
        </div>
      </div>
    </AdminShell>
  );
}

function SummaryTile({ color, count, label, sub, pulse }) {
  return (
    <div style={{ position: "relative", background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: "16px 18px", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: color }} />
      {pulse && count > 0 && (
        <span style={{ position: "absolute", top: 14, right: 14, width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 0 0 ${color}`, animation: "dashPulse 1.6s ease-out infinite" }} />
      )}
      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.6, textTransform: "uppercase", color: "var(--ink-4)" }}>{label}</div>
      <div style={{ fontFamily: "var(--sans)", fontSize: 32, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em", color: count > 0 ? color : "var(--ink-3)", marginTop: 8 }}>{count}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function TimelineCard({ t, go, onDuplicate, onDelete }) {
  const status = statusFor(t);
  const open = () => {
    const q = { id: t.id };
    if (t.side === "seller") q.side = "seller";
    go("/admin/timeline", q);
  };
  return (
    <div
      className="tl-dash-row tl-dash-card"
      onClick={open}
      style={{
        position: "relative", background: "#fff", border: "1px solid var(--line)", borderRadius: 10,
        padding: "14px 22px 16px 26px",
        cursor: "pointer", transition: "border-color 0.12s, transform 0.12s, box-shadow 0.12s",
        opacity: t.closed ? 0.65 : 1
      }}
      onMouseEnter={e => { if (!t.closed) { e.currentTarget.style.borderColor = "var(--ink-4)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px -4px rgba(11,11,11,0.12)"; }}}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: status.color, borderRadius: "10px 0 0 10px" }} />
      {status.pulse && (
        <span style={{ position: "absolute", left: -3, top: "calc(50% - 5px)", width: 10, height: 10, borderRadius: "50%", background: status.color, boxShadow: `0 0 0 0 ${status.color}`, animation: "dashPulse 1.6s ease-out infinite" }} />
      )}

      {/* TOP ROW — badges, full width, separate from the column grid */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", padding: "2px 7px", borderRadius: 3, background: t.side === "seller" ? "#1A1816" : "var(--red-wash)", color: t.side === "seller" ? "#fff" : "var(--red)" }}>{t.side === "seller" ? "Listing" : "Buyer"}</span>
        <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", padding: "2px 7px", borderRadius: 3, background: status.bg, color: status.color }}>{status.label}</span>
      </div>

      {/* DATA ROW — 4 aligned columns + actions */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2.2fr 1fr 1fr 1.4fr auto",
        gap: 18, alignItems: "start"
      }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4, fontSize: 10 }}>Property</div>
          <div style={{ fontFamily: "var(--sans)", fontSize: 14, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.005em", lineHeight: 1.25 }}>{t.addr}</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span>{t.side === "seller" ? "Seller" : "Buyer"}: <span style={{ color: "var(--ink-2)", fontWeight: 600 }}>{t.client}</span></span>
            {t.leadAgent && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: "linear-gradient(135deg, var(--red), var(--red-ink))", color: "#fff", fontSize: 8, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", letterSpacing: 0.3 }}>{t.leadAgent.split(" ").map(n => n[0]).join("")}</span>
                <span style={{ color: "var(--ink-3)" }}>Lead: <span style={{ color: "var(--ink-2)", fontWeight: 600 }}>{t.leadAgent}</span></span>
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 4, fontSize: 10 }}>Closing</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", lineHeight: 1.25 }}>{t.close || "—"}</div>
          {!t.closed && t.close && (
            <div style={{ fontSize: 11.5, color: status.color, fontWeight: 600, marginTop: 2 }}>
              {t.daysToClose < 0
                ? `${Math.abs(t.daysToClose)}d overdue`
                : t.daysToClose === 0 ? "today" : `in ${t.daysToClose}d`}
            </div>
          )}
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 4, fontSize: 10 }}>Acceptance</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-2)", lineHeight: 1.25 }}>{t.accept || "—"}</div>
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 4, fontSize: 10 }}>{t.closed ? "Status" : "Next Deadline"}</div>
          {t.closed ? (
            <Chip tone="green" dot>Closed</Chip>
          ) : t.nextDeadline ? (
            <NextDeadline d={t.nextDeadline} />
          ) : (
            <div style={{ fontSize: 12.5, color: "var(--ink-4)" }}>—</div>
          )}
        </div>

        <div style={{ display: "flex", gap: 6, alignSelf: "center" }} onClick={e => e.stopPropagation()}>
          <button className="btn btn-ghost btn-sm" onClick={open}><Icon name="edit" size={12} /> Open</button>
          <button className="btn btn-ghost btn-sm" onClick={onDuplicate} title="Duplicate"><Icon name="copy" size={12} /></button>
          <button className="btn btn-ghost btn-sm" onClick={onDelete} title="Delete" style={{ color: "var(--red)", borderColor: "var(--red)" }}><Icon name="trash" size={12} /></button>
        </div>
      </div>
    </div>
  );
}

function NextDeadline({ d }) {
  const isPast = d.daysFrom < 0;
  const isToday = d.daysFrom === 0;
  const isSoon = d.daysFrom > 0 && d.daysFrom <= 3;
  const color = isPast || isToday ? "var(--red)" : isSoon ? "var(--amber)" : "var(--ink-2)";
  const tagLabel = isPast ? `${Math.abs(d.daysFrom)}d overdue` : isToday ? "Due today" : `${d.daysFrom}d`;
  return (
    <div style={{ minWidth: 0, maxWidth: "100%" }}>
      <div style={{
        fontSize: 13, fontWeight: 700, color: "var(--ink)", lineHeight: 1.3,
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        overflow: "hidden", wordBreak: "break-word"
      }}>
        <span style={{ fontFamily: "monospace", color, marginRight: 5 }}>{d.term}</span>
        {d.label}
      </div>
      <div style={{ fontSize: 11.5, color, fontWeight: 600, marginTop: 3 }}>
        {d.date} · {tagLabel}
      </div>
    </div>
  );
}

// ─── DEMO DATA ─────────────────────────────────────────────────────────────
// Seeds the store with a few transactions on first load so the dashboard
// isn't empty for a new user. Real-world deployment: delete this seeder.
function seedDemoData() {
  if (typeof window.getInitialSideState !== "function") return;
  const today = new Date();
  const offsetDate = (days) => {
    const d = new Date(today.getTime() + days * 86400000);
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
  };
  const seed = [
    { side: "buyer",  addr: "4601 Kāhala Ave, Kāhala", client: "Lani & Marcus Chen", lead: "Daniel Ulu",       acceptDays: -42, closeDays: -2 },
    { side: "seller", addr: "217 Paikō Drive, Hawaiʻi Kai", client: "Nalani Watanabe", lead: "Hunter Tipold",    acceptDays: -36, closeDays: 6 },
    { side: "buyer",  addr: "1234 Punawai Ave, Honolulu", client: "Daniel & Kaimana Tester", lead: "Daniel Ulu", acceptDays: -34, closeDays: 11 },
    { side: "seller", addr: "59-316 Ke Nui Rd, North Shore", client: "Kealoha Family Trust", lead: "Dominique Unrein", acceptDays: -22, closeDays: 23 },
    { side: "buyer",  addr: "1188 Bishop St · 2806, Downtown", client: "Aiden Park", lead: "Hunter Tipold",      acceptDays: -15, closeDays: 30 },
  ];
  seed.forEach(s => {
    const init = window.getInitialSideState(s.side);
    init.property = s.addr;
    init.acceptance = offsetDate(s.acceptDays);
    init.closing = offsetDate(s.closeDays);
    init.leadAgent = s.lead;
    // Stamp client name on the matching principal party row
    init.parties = init.parties.map(p =>
      p.role === s.side ? { ...p, name: s.client } : p
    );
    const otherInit = window.getInitialSideState(s.side === "buyer" ? "seller" : "buyer");
    transactionStore.create({
      [s.side]: init,
      [s.side === "buyer" ? "seller" : "buyer"]: otherInit
    });
  });
}

Object.assign(window, { AdminDashboard, AdminShell });
