// timeline_editor.jsx — per-transaction editor
// Persistence: handled via transactionStore (shared.jsx). Each transaction has
// its own id and stores { buyer: SideState, seller: SideState, updatedAt }.

// ────────────────────────────────────────────────────────────────────────────
// DATE HELPERS — parse common TC date formats and add calendar/business days
// ────────────────────────────────────────────────────────────────────────────
function parseDate(str) {
  if (!str) return null;
  const s = String(str).trim();
  // MM/DD/YY or MM/DD/YYYY (also accepts dashes)
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let [, mo, d, y] = m;
    y = +y;
    if (y < 100) y += 2000;
    const dt = new Date(+y, +mo - 1, +d);
    return isNaN(dt.getTime()) ? null : dt;
  }
  // Fallback: "May 8, 2026" / "Mar 28 2026" etc.
  const t = new Date(s);
  return isNaN(t.getTime()) ? null : t;
}

function formatDateShort(d) {
  if (!d) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

function addCalendarDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function addBusinessDays(date, n) {
  const d = new Date(date);
  let remaining = Math.abs(n);
  const step = n >= 0 ? 1 : -1;
  while (remaining > 0) {
    d.setDate(d.getDate() + step);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) remaining--;
  }
  return d;
}

function getInitialSideState(side) {
  const isSeller = side === "seller";
  return {
    // Blank template — TC fills these in per transaction
    property: "",
    escrow: "",
    contractRef: "",
    acceptance: "",
    closing: "",
    openEscrow: "",
    conditionalLoan: "",
    leadAgent: "Daniel Ulu",
    transactionType: "standard",
    parties: isSeller
      ? [
          // Our side first on the listing-side timeline
          { role: "seller",      name: "", email: "", phone: "", highlight: true  },
          { role: "sellerAgent", name: "", email: "", phone: "", highlight: true  },
          { role: "buyer",       name: "", email: "", phone: "", highlight: false },
          { role: "buyerAgent",  name: "", email: "", phone: "", highlight: false }
        ]
      : [
          // Our side first on the buyer-side timeline
          { role: "buyer",       name: "", email: "", phone: "", highlight: true  },
          { role: "buyerAgent",  name: "", email: "", phone: "", highlight: true  },
          { role: "seller",      name: "", email: "", phone: "", highlight: false },
          { role: "sellerAgent", name: "", email: "", phone: "", highlight: false }
        ],
    sections: JSON.parse(JSON.stringify(isSeller ? defaultSellerSections : defaultBuyerSections)),
  };
}

// ─── PERSISTENCE — per-transaction via transactionStore ─────────────────
function useTimelineState(txId, side) {
  const [allState, setAllState] = React.useState(() => {
    if (txId) {
      const tx = transactionStore.get(txId);
      if (tx) {
        return {
          buyer: tx.buyer || getInitialSideState("buyer"),
          seller: tx.seller || getInitialSideState("seller"),
          savedAt: tx.updatedAt || null,
        };
      }
    }
    return {
      buyer: getInitialSideState("buyer"),
      seller: getInitialSideState("seller"),
      savedAt: null,
    };
  });
  const [savedAt, setSavedAt] = React.useState(allState.savedAt);

  // Fetch from server when the cache may not be ready yet
  React.useEffect(() => {
    if (!txId) return;
    if (transactionStore.get(txId)) return;
    transactionStore.fetchAll().then(() => {
      const tx = transactionStore.get(txId);
      if (tx) {
        setAllState({
          buyer: tx.buyer || getInitialSideState("buyer"),
          seller: tx.seller || getInitialSideState("seller"),
          savedAt: tx.updatedAt || null,
        });
        setSavedAt(tx.updatedAt || null);
      }
    });
  }, [txId]);

  // Reload state when switching transactions
  React.useEffect(() => {
    if (txId) {
      const tx = transactionStore.get(txId);
      if (tx) {
        setAllState({
          buyer: tx.buyer || getInitialSideState("buyer"),
          seller: tx.seller || getInitialSideState("seller"),
          savedAt: tx.updatedAt || null,
        });
        setSavedAt(tx.updatedAt || null);
      }
    }
  }, [txId]);

  React.useEffect(() => {
    if (!txId) return;
    const t = setTimeout(() => {
      transactionStore.save(txId, { buyer: allState.buyer, seller: allState.seller });
      setSavedAt(Date.now());
    }, 300);
    return () => clearTimeout(t);
  }, [allState, txId]);

  const sideState = allState[side];
  const setSideState = (updater) => {
    setAllState(prev => ({
      ...prev,
      [side]: typeof updater === "function" ? updater(prev[side]) : updater,
    }));
  };
  return [sideState, setSideState, savedAt];
}

function formatSaved(ts) {
  if (!ts) return "Not saved yet";
  const secs = Math.round((Date.now() - ts) / 1000);
  if (secs < 5) return "Saved · just now";
  if (secs < 60) return `Saved · ${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `Saved · ${mins}m ago`;
  const d = new Date(ts);
  return `Saved · ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function TimelineEditor({ go, txId: txIdProp, side = "buyer" }) {
  // If no txId was passed (e.g. user hit /admin/timeline directly), auto-create one
  const [txId, setTxId] = React.useState(() => {
    if (txIdProp) return txIdProp;
    const created = transactionStore.create({
      buyer: getInitialSideState("buyer"),
      seller: getInitialSideState("seller"),
    });
    // Push the id into the URL so refresh / bookmarks work
    window.location.hash = `/admin/timeline?id=${created.id}${side === "seller" ? "&side=seller" : ""}`;
    return created.id;
  });
  React.useEffect(() => { if (txIdProp) setTxId(txIdProp); }, [txIdProp]);

  const [showTC, setShowTC] = useState(window.__TWEAKS__?.showTCDirections !== false);
  const [s, setS, savedAt] = useTimelineState(txId, side);
  const [, force] = React.useState(0); // ticks the "saved Ns ago" label
  // Set of `${sIdx}:${rIdx}` keys for rows whose dates just cascaded from an upstream anchor change.
  // Cleared 2.4s after the cascade so the flash animation has time to play out.
  const [cascadedKeys, setCascadedKeys] = React.useState(() => new Set());
  const cascadeTimerRef = React.useRef(null);
  React.useEffect(() => {
    const id = setInterval(() => force(n => n + 1), 15000);
    return () => clearInterval(id);
  }, []);

  const isSeller = side === "seller";
  const handlePrint = () => window.print();
  const handleExportPDF = () => {
    if (window.jspdf && window.jspdf.jsPDF) {
      try { return exportTimelinePDF(s, side, isSeller); } catch (e) { console.warn("PDF export failed, falling back to print", e); }
    }
    window.print();
  };

  const handleReset = () => {
    if (!window.confirm(`Reset the ${isSeller ? "listing" : "buyer"}-side timeline to defaults? This will clear all checkboxes, dates, and comments for this side. The other side is unaffected.`)) return;
    setS(getInitialSideState(side));
  };

  const setField = (key, val) => setS(prev => {
    const next = { ...prev, [key]: val };
    // Sync top-level Closing Date ↔ F-2 row's due date
    if (key === "closing") {
      next.sections = prev.sections.map(sec => ({
        ...sec,
        rows: sec.rows.map(r => r.term === "F-2" ? { ...r, due: val } : r)
      }));
    }
    return next;
  });
  const setParty = (i, partial) => setS(prev => ({
    ...prev,
    parties: prev.parties.map((p, j) => j === i ? { ...p, ...partial } : p)
  }));
  const addParty = (role) => setS(prev => {
    const ourSide = !isSeller;
    const isOurRole = ourSide
      ? (role === "buyer" || role === "buyerAgent")
      : (role === "seller" || role === "sellerAgent");
    const newRow = { role, name: "", email: "", phone: "", highlight: isOurRole };
    // Insert immediately after the last existing row of this role (groups stay together)
    let insertAt = prev.parties.length;
    for (let i = prev.parties.length - 1; i >= 0; i--) {
      if (prev.parties[i].role === role) { insertAt = i + 1; break; }
    }
    return { ...prev, parties: [...prev.parties.slice(0, insertAt), newRow, ...prev.parties.slice(insertAt)] };
  });
  const removeParty = (i) => setS(prev => ({ ...prev, parties: prev.parties.filter((_, j) => j !== i) }));

  // ─── AUTO-COMPUTE DUE DATES ────────────────────────────────────────────────
  // Whenever Acceptance, Closing, or any row's days/unit/basis changes, recompute
  // every non-attached row's due date from its anchor and write changes back.
  // Two-pass: (1) acceptance/closing-anchored rows first, (2) rows that depend on
  // another row (I-1, M-1.1, J-1) second.
  React.useEffect(() => {
    const accDate = parseDate(s.acceptance);
    const closDate = parseDate(s.closing);
    if (!accDate && !closDate) return;

    const compute = (anchor, row) => {
      if (!anchor || row.days == null) return null;
      const n = row.basis === "closing" ? -row.days : row.days;
      const d = row.unit === "business" ? addBusinessDays(anchor, n) : addCalendarDays(anchor, n);
      return formatDateShort(d);
    };

    const basisTermMap = { "I-1": "I-1(b)", "M-1.1": "M-1(d)", "J-1": "J-1" };
    const rowDueByTerm = {};
    const updates = []; // { sIdx, rIdx, due }

    // Pass 1: rows anchored to Acceptance or Closing
    s.sections.forEach((sec, sIdx) => {
      sec.rows.forEach((r, rIdx) => {
        if (r.basis === "attached") return;
        if (r.manual) { if (r.due) rowDueByTerm[r.term] = r.due; return; }
        let anchor = null;
        if (r.basis === "acceptance") anchor = accDate;
        else if (r.basis === "closing") anchor = closDate;
        else return;
        const newDue = compute(anchor, r);
        if (newDue) {
          rowDueByTerm[r.term] = newDue;
          if (r.due !== newDue) updates.push({ sIdx, rIdx, due: newDue });
        }
      });
    });

    // Pass 2: rows anchored to another row (I-1, M-1.1, J-1)
    s.sections.forEach((sec, sIdx) => {
      sec.rows.forEach((r, rIdx) => {
        if (!basisTermMap[r.basis]) return;
        if (r.manual) return;
        const refDue = rowDueByTerm[basisTermMap[r.basis]];
        const anchor = parseDate(refDue);
        if (!anchor) return;
        const newDue = compute(anchor, r);
        if (newDue && r.due !== newDue) updates.push({ sIdx, rIdx, due: newDue });
      });
    });

    if (updates.length === 0) return;
    // Flash the rows that just moved so the TM can see the cascade visually
    const keys = new Set(updates.map(u => `${u.sIdx}:${u.rIdx}`));
    setCascadedKeys(keys);
    clearTimeout(cascadeTimerRef.current);
    cascadeTimerRef.current = setTimeout(() => setCascadedKeys(new Set()), 2400);
    setS(prev => ({
      ...prev,
      sections: prev.sections.map((sec, sIdx) => ({
        ...sec,
        rows: sec.rows.map((r, rIdx) => {
          const u = updates.find(x => x.sIdx === sIdx && x.rIdx === rIdx);
          return u ? { ...r, due: u.due } : r;
        })
      }))
    }));
  }, [s.acceptance, s.closing, s.sections]);
  const setRow = (sIdx, rIdx, partial) => setS(prev => {
    const targetRow = prev.sections[sIdx]?.rows[rIdx];
    const next = {
      ...prev,
      sections: prev.sections.map((sec, si) => si !== sIdx ? sec : {
        ...sec,
        rows: sec.rows.map((r, ri) => ri !== rIdx ? r : { ...r, ...partial })
      })
    };
    // Sync F-2 row's due date ↔ top-level Closing Date
    if (targetRow?.term === "F-2" && "due" in partial) {
      next.closing = partial.due;
    }
    return next;
  });

  const printProps = {
    side,
    property: { address: s.property, escrow: s.escrow },
    dates: { acceptance: s.acceptance, closing: s.closing, contractRef: s.contractRef, openEscrow: s.openEscrow, conditionalLoan: s.conditionalLoan },
    parties: s.parties,
    sections: s.sections
  };

  return (
    <div style={{ minHeight: "100vh", background: "#EDEBE7", paddingBottom: 80 }}>
      <TimelinePrint {...printProps} />
      {/* Red header bar */}
      <div style={{ background: "var(--red)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, color: "#fff", position: "sticky", top: 0, zIndex: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>{isSeller ? "Listing-Side Timeline" : "Buyer-Side Timeline"} · Escrow #</div>
            <input
              type="text"
              value={s.escrow || ""}
              onChange={e => setField("escrow", e.target.value)}
              placeholder="Enter escrow #"
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#fff",
                fontFamily: "var(--sans)",
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "0.02em",
                padding: 0,
                width: 180,
              }}
              onFocus={e => { e.currentTarget.style.borderBottom = "1px solid rgba(255,255,255,0.6)"; }}
              onBlur={e => { e.currentTarget.style.borderBottom = "none"; }}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <SavedIndicator savedAt={savedAt} />
          <SideSwitch side={side} go={go} txId={txId} />
          <button className="btn btn-sm" style={{ background: "#fff", color: "var(--red)", border: "1px solid #fff", fontWeight: 700 }} onClick={handleExportPDF} title="Single-page PDF (landscape)"><Icon name="download" size={12} /> Export PDF</button>
          <button className="btn btn-sm" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.35)" }} onClick={() => go("/admin/dashboard")}>← Dashboard</button>
        </div>
      </div>

      {/* Black date bar */}
      <div className="tl-date-bar" style={{ background: "var(--ink)", color: "#fff", padding: "18px 28px", display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 22, alignItems: "center" }}>
        <DateField label="Acceptance Date" value={s.acceptance} onChange={v => setField("acceptance", v)} placeholder="MM/DD/YY" />
        <DateField label="Closing Date" value={s.closing} onChange={v => setField("closing", v)} placeholder="MM/DD/YY" highlight />
        <button className="btn btn-sm" style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.5)" }} onClick={handleReset}>↻ Reset</button>
      </div>

      {/* Closing date calculator */}
      <ClosingCalculator
        acceptance={s.acceptance}
        closing={s.closing}
        onApply={v => setField("closing", v)}
      />

      <div style={{ padding: "24px 28px", maxWidth: 1500, margin: "0 auto" }}>
        {/* Property info form */}
        <Card accent style={{ padding: "22px 26px", marginBottom: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Property & Parties</div>

          {/* Agent assignment strip — top of card */}
          <div className="tl-agent-strip" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16, padding: "14px 16px", background: "var(--red-wash)", borderRadius: 8, border: "1px solid #F1D8D9" }}>
            <div>
              <div className="label" style={{ color: "var(--red)" }}>Primary Agent</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--red), var(--red-ink))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>DU</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Daniel Ulu</div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-4)", letterSpacing: 0.2 }}>Referenced on all contracts & addenda</div>
                </div>
              </div>
            </div>
            <div>
              <label className="label">Lead Agent</label>
              <select
                className="input"
                value={s.leadAgent}
                onChange={e => setField("leadAgent", e.target.value)}
                style={{ fontWeight: 600 }}
              >
                <option value="Daniel Ulu">Daniel Ulu</option>
                <option value="Hunter Tipold">Hunter Tipold</option>
                <option value="Dominique Unrein">Dominique Unrein</option>
              </select>
              <div style={{ fontSize: 10.5, color: "var(--ink-4)", marginTop: 4, letterSpacing: 0.2 }}>In charge of transaction · not on contracts</div>
            </div>
          </div>

          <div className="tl-grid-2" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
            <Field label="Property Address" value={s.property} onChange={v => setField("property", v)} wide />
            <Field label="Escrow #" value={s.escrow} onChange={v => setField("escrow", v)} />
          </div>
          <div className="tl-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 12 }}>
            <Field isDate label="Contract Reference Date" value={s.contractRef} onChange={v => setField("contractRef", v)} />
            <Field isDate label="Open Escrow Date" value={s.openEscrow} onChange={v => setField("openEscrow", v)} />
            <Field isDate label="Conditional Loan Approval" value={s.conditionalLoan} onChange={v => setField("conditionalLoan", v)} />
          </div>
          <div style={{ marginTop: 12 }}>
            <label className="label">Transaction Type</label>
            <select
              className="input"
              value={s.transactionType}
              onChange={e => setField("transactionType", e.target.value)}
              style={{ fontWeight: 600 }}
            >
              <option value="standard">Standard Sale</option>
              <option value="short_sale">Short Sale</option>
              <option value="pre_foreclosure">Pre-Foreclosure</option>
            </select>
            {s.transactionType === "short_sale" && (
              <div style={{ fontSize: 11.5, color: "#6B4E10", background: "var(--gold-wash)", border: "1px solid #E8D079", borderLeft: "3px solid var(--gold)", padding: "8px 12px", borderRadius: 4, marginTop: 6, lineHeight: 1.5 }}>
                <strong>Short Sale:</strong> Lender approval required before closing. Add 30–90 days to standard timeline. Verify Lender Short Sale Approval addendum is attached to the PC.
              </div>
            )}
            {s.transactionType === "pre_foreclosure" && (
              <div style={{ fontSize: 11.5, color: "#6B4E10", background: "var(--gold-wash)", border: "1px solid #E8D079", borderLeft: "3px solid var(--gold)", padding: "8px 12px", borderRadius: 4, marginTop: 6, lineHeight: 1.5 }}>
                <strong>Pre-Foreclosure:</strong> Confirm auction/foreclosure date with seller's lender. Closing must occur before. HRS 667 disclosures may apply. Coordinate closely with seller's attorney.
              </div>
            )}
          </div>
          <div style={{ height: 18 }} />
          {/* Column headers for party rows */}
          <div className="tl-party-headers" style={{ display: "grid", gridTemplateColumns: "130px 1fr 1.3fr 0.8fr", gap: 10, padding: "0 12px", marginBottom: 4 }}>
            <span className="label" style={{ marginBottom: 0 }}>Role</span>
            <span className="label" style={{ marginBottom: 0 }}>Name(s)</span>
            <span className="label" style={{ marginBottom: 0 }}>Email</span>
            <span className="label" style={{ marginBottom: 0 }}>Cell #</span>
          </div>
          {s.parties.map((p, i) => {
            // Compute display label based on role + duplicates
            const sameRole = s.parties.filter(x => x.role === p.role);
            const sameRoleIdx = sameRole.indexOf(p);
            const baseLabel = { seller: "Seller", buyer: "Buyer", sellerAgent: "Seller Agent", buyerAgent: "Buyer Agent" }[p.role] || p.role;
            const isPrincipal = p.role === "seller" || p.role === "buyer";
            const displayLabel = !isPrincipal
              ? baseLabel
              : (sameRole.length === 1 ? `${baseLabel}(s)` : `${baseLabel} #${sameRoleIdx + 1}`);
            // Opposing principal: name only (other side's buyer/seller)
            const isOpposingPrincipal =
              (!isSeller && p.role === "seller") ||
              ( isSeller && p.role === "buyer");
            // Show "+ Add" button after the last row of a principal role
            const isLastOfRole = i === s.parties.length - 1 || s.parties[i + 1].role !== p.role;
            const showAddBtn = isPrincipal && isLastOfRole;
            const canRemove = isPrincipal && sameRole.length > 1;
            return (
              <React.Fragment key={i}>
                <PartyRow
                  label={displayLabel}
                  name={p.name}
                  email={p.email}
                  phone={p.phone}
                  highlight={p.highlight}
                  nameOnly={isOpposingPrincipal}
                  canRemove={canRemove}
                  onRemove={() => removeParty(i)}
                  onChange={partial => setParty(i, partial)}
                />
                {showAddBtn && (
                  <button
                    onClick={() => addParty(p.role)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      marginLeft: 142, marginBottom: 10, marginTop: -2,
                      fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase",
                      color: "var(--ink-3)", padding: "4px 10px",
                      background: "transparent", border: "1px dashed var(--line)", borderRadius: 4,
                      cursor: "pointer"
                    }}
                  >
                    <Icon name="plus" size={11} /> Add {p.role === "seller" ? "Seller" : "Buyer"}
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </Card>

        {/* Legend */}
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: "14px 22px", display: "flex", alignItems: "center", gap: 22, marginBottom: 20, flexWrap: "wrap" }}>
          <span className="eyebrow">Key</span>
          <Legend color="var(--red)" label="Critical" />
          <Legend color="var(--amber)" label="Time-Sensitive" />
          <Legend color="var(--ink-3)" label="Standard" />
          <Legend color="#6A8EBD" label="AUTO" pill />
          <Legend color="#8A7A6B" label="MANUAL" pill />
          <div style={{ flex: 1 }} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <Toggle on={showTC} onChange={setShowTC} />
            <span style={{ fontWeight: 600 }}>📋 TC Directions</span>
          </label>
        </div>

        {/* Sections */}
        {s.sections.map((sec, i) => (
          <TimelineSection
            key={i}
            sectionIdx={i}
            section={sec}
            go={go}
            showTC={showTC}
            cascadedKeys={cascadedKeys}
            onRowChange={(rIdx, partial) => setRow(i, rIdx, partial)}
          />
        ))}

        <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 26, padding: "14px 18px", background: "#fff", borderRadius: 8, border: "1px solid var(--line)", lineHeight: 1.6 }}>
          <strong>Disclaimer:</strong> This checklist is a working internal document maintained by The Ulu Team transaction coordinator. Dates are calculated from Acceptance Date using HAR standard contingency periods. All parties should rely on the executed Purchase Contract and its addenda as the controlling documents. © 2026 The Ulu Team · Keller Williams Honolulu · RB-21303.
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="tl-sticky-bar" style={{ position: "sticky", bottom: 0, background: "#fff", borderTop: "1px solid var(--line)", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 -8px 20px -8px rgba(0,0,0,0.08)", zIndex: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600 }}>
              <Toggle on={showTC} onChange={setShowTC} />
              📋 TC Directions
            </label>
            <button className="btn btn-ghost btn-sm" onClick={() => go("/admin/dashboard")}>Dashboard</button>
            <span style={{ fontSize: 11.5, color: "var(--ink-3)", marginLeft: 6 }}>{formatSaved(savedAt)} · stored on this device</span>
          </div>
          <div className="tl-sticky-actions" style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={handleExportPDF}><Icon name="print" size={12} /> Print</button>
            <button className="btn btn-ghost btn-sm" onClick={handleExportPDF}><Icon name="download" size={12} /> Save as PDF</button>
            <button className="btn btn-red btn-sm" onClick={() => { transactionStore.save(txId, { buyer: s.side === "buyer" ? s : undefined, seller: s.side === "seller" ? s : undefined }); alert("Saved."); }}><Icon name="check" size={12} /> Force Save</button>
          </div>
      </div>
    </div>
  );
}

function SavedIndicator({ savedAt }) {
  const [, tick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 15000);
    return () => clearInterval(id);
  }, []);
  return (
    <div title="Edits are saved automatically to this browser." style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.35)",
      borderRadius: 6, padding: "5px 10px",
      fontSize: 10.5, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: "rgba(255,255,255,0.92)"
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: savedAt ? "#7DD894" : "rgba(255,255,255,0.6)" }} />
      {formatSaved(savedAt).replace("Saved · ", "")}
    </div>
  );
}

function ClosingCalculator({ acceptance, closing, onApply }) {
  const [daysOut, setDaysOut] = React.useState(45);
  const [unit, setUnit] = React.useState("calendar");

  const accDate = parseDate(acceptance);
  const closDate = parseDate(closing);
  const rawComputed = accDate
    ? (unit === "business" ? addBusinessDays(accDate, daysOut) : addCalendarDays(accDate, daysOut))
    : null;
  // Per F-2: if closing falls on a day the Bureau of Conveyances is closed (Sat/Sun),
  // bump to the next recording day (Monday).
  let computed = rawComputed;
  let bumpedFrom = null;
  if (rawComputed) {
    const dow = rawComputed.getDay();
    if (dow === 6)      { computed = addCalendarDays(rawComputed, 2); bumpedFrom = "Sat"; }
    else if (dow === 0) { computed = addCalendarDays(rawComputed, 1); bumpedFrom = "Sun"; }
  }
  const computedStr = computed ? formatDateShort(computed) : null;
  const alreadyMatches = closDate && computed && +closDate === +computed;
  const closingDow = computed ? ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][computed.getDay()] : "";

  // Auto-push the computed date up to the Closing Date field whenever it changes.
  React.useEffect(() => {
    if (computedStr && !alreadyMatches) onApply(computedStr);
  }, [computedStr, alreadyMatches]);

  return (
    <div style={{ background: "#1A1816", color: "#D9D5CF", padding: "12px 28px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid #2A2624", flexWrap: "wrap" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.6, textTransform: "uppercase", color: "#8A8580", display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="search" size={11} /> Closing Calc
      </div>
      <span style={{ fontSize: 12.5, color: "#A8A4A0" }}>Acceptance</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: accDate ? "#fff" : "#6B6660", fontFamily: "monospace" }}>
        {accDate ? formatDateShort(accDate) : "— enter acceptance date above —"}
      </span>
      <span style={{ fontSize: 13, color: "#6B6660" }}>+</span>
      <input
        type="number"
        min={1}
        max={365}
        value={daysOut}
        onChange={e => setDaysOut(Math.max(1, +e.target.value || 0))}
        style={{ width: 56, padding: "5px 8px", background: "#0B0B0B", border: "1px solid #3A3633", borderRadius: 4, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "monospace", textAlign: "center" }}
      />
      <select
        value={unit}
        onChange={e => setUnit(e.target.value)}
        style={{ padding: "5px 8px", background: "#0B0B0B", border: "1px solid #3A3633", borderRadius: 4, color: "#fff", fontSize: 12 }}
      >
        <option value="calendar">calendar days</option>
        <option value="business">business days</option>
      </select>
      <span style={{ fontSize: 13, color: "#6B6660" }}>=</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: computed ? (bumpedFrom ? "#E8B14A" : "#7DD894") : "#6B6660", fontFamily: "monospace" }}>
        {computedStr || "—"}
      </span>
      {computed && (
        <span style={{ fontSize: 11, color: bumpedFrom ? "#E8B14A" : "#8A8580" }}>
          ({closingDow}{bumpedFrom ? ` · bumped from ${bumpedFrom}` : ""})
        </span>
      )}
      <div style={{ flex: 1 }} />
      {/* Quick preset chips */}
      <div style={{ display: "flex", gap: 4 }}>
        {[30, 45, 60, 90].map(n => (
          <button
            key={n}
            onClick={() => { setDaysOut(n); setUnit("calendar"); }}
            style={{
              padding: "4px 10px", fontSize: 11, fontWeight: 700,
              background: daysOut === n && unit === "calendar" ? "var(--red)" : "transparent",
              color: daysOut === n && unit === "calendar" ? "#fff" : "#A8A4A0",
              border: "1px solid " + (daysOut === n && unit === "calendar" ? "var(--red)" : "#3A3633"),
              borderRadius: 4, cursor: "pointer"
            }}
          >{n}d</button>
        ))}
      </div>
      <button
        disabled
        title="Closing Date above auto-syncs from this calculator"
        style={{
          padding: "6px 12px", fontSize: 10, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase",
          background: "transparent", color: "#7DD894",
          border: "1px solid #2A4A33", borderRadius: 4,
          cursor: "default", display: "inline-flex", alignItems: "center", gap: 6
        }}
      >
        ↑ Auto-syncs
      </button>
    </div>
  );
}

function DateField({ label, value, onChange, highlight, placeholder }) {
  const d = parseDate(value);
  const isoValue = d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    : "";
  const handleChange = (e) => {
    const v = e.target.value;
    if (!v) { onChange(""); return; }
    const [y, m, day] = v.split("-");
    onChange(`${m}/${day}/${y.slice(-2)}`);
  };
  return (
    <div>
      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: highlight ? "#F5B8BA" : "#A8A4A0", marginBottom: 4 }}>{label}</div>
      <input
        type="date"
        value={isoValue}
        onChange={handleChange}
        aria-label={label}
        style={{
          background: "transparent", border: "none", outline: "none", padding: 0,
          fontFamily: "var(--sans)", fontSize: 20, fontWeight: 700,
          color: highlight ? "#fff" : "#E5E1DC", letterSpacing: "-0.01em",
          width: "auto", maxWidth: "100%", cursor: "pointer", colorScheme: "dark"
        }}
      />
    </div>
  );
}
function Field({ label, value, onChange, wide, isDate }) {
  if (isDate) {
    return <DatePickerField label={label} value={value} onChange={onChange} />;
  }
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function DatePickerField({ label, value, onChange, compact, placeholder }) {
  const d = parseDate(value);
  const isoValue = d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    : "";
  const handleChange = (e) => {
    const v = e.target.value;
    if (!v) { onChange(""); return; }
    const [y, m, day] = v.split("-");
    onChange(`${m}/${day}/${y.slice(-2)}`);
  };
  if (compact) {
    return (
      <input
        type="date"
        value={isoValue}
        onChange={handleChange}
        aria-label={label || "Date"}
        style={{
          background: "transparent", border: "none", outline: "none",
          padding: 0,
          fontWeight: 600, color: "var(--ink)",
          fontSize: 13, fontFamily: "var(--sans)",
          width: "100%", cursor: "pointer"
        }}
      />
    );
  }
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="date"
        className="input"
        value={isoValue}
        onChange={handleChange}
        aria-label={label}
        style={{ cursor: "pointer", fontFamily: "var(--sans)" }}
      />
    </div>
  );
}
function PartyRow({ label, name, email, phone, highlight, onChange, nameOnly, canRemove, onRemove }) {
  const removeBtn = canRemove ? (
    <button
      onClick={onRemove}
      title="Remove"
      style={{
        width: 24, height: 24, borderRadius: 4, color: "var(--ink-4)",
        background: "transparent", border: "1px solid transparent",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", flexShrink: 0
      }}
      onMouseEnter={e => { e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.borderColor = "var(--red)"; }}
      onMouseLeave={e => { e.currentTarget.style.color = "var(--ink-4)"; e.currentTarget.style.borderColor = "transparent"; }}
    ><Icon name="close" size={12} /></button>
  ) : <span style={{ width: 24 }} />;
  if (nameOnly) {
    return (
      <div className="tl-party-row-name" style={{ display: "grid", gridTemplateColumns: "130px 1fr 24px", gap: 10, alignItems: "center", padding: "8px 12px", borderRadius: 6, background: highlight ? "var(--red-wash)" : "transparent", marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: highlight ? "var(--red)" : "var(--ink-3)" }}>{label}</span>
        <input className="input" placeholder="Name(s) — contact tracked via their agent" value={name} onChange={e => onChange({ name: e.target.value })} />
        {removeBtn}
      </div>
    );
  }
  return (
    <div className="tl-party-row" style={{ display: "grid", gridTemplateColumns: "130px 1fr 1.3fr 0.8fr 24px", gap: 10, alignItems: "center", padding: "8px 12px", borderRadius: 6, background: highlight ? "var(--red-wash)" : "transparent", marginBottom: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: highlight ? "var(--red)" : "var(--ink-3)" }}>{label}</span>
      <input className="input" placeholder="Name(s)" value={name} onChange={e => onChange({ name: e.target.value })} />
      <input className="input" placeholder="Email" value={email} onChange={e => onChange({ email: e.target.value })} />
      <input className="input" placeholder="Phone" value={phone} onChange={e => onChange({ phone: e.target.value })} />
      {removeBtn}
    </div>
  );
}
function Legend({ color, label, pill }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>
      <span style={{ width: pill ? 28 : 10, height: pill ? 14 : 10, background: color, borderRadius: pill ? 3 : 2, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>{pill ? label : ""}</span>
      {!pill && label}
    </div>
  );
}

// HAR Standard Transaction Timeline — 22-row template
// Source: Ulu Team's HAR-derived Transaction Timeline (Timeline (3).pdf)
// Day-counts reflect Ulu Team's standard fill of the HAR RR201 blanks.
const defaultBuyerSections = [
  { title: "Opening & Deposits", tc: "Verification of Cash Funds (H-1(a)) and Pre-Qual Letter (H-4(a)) typically ship with the Purchase Contract; flip the basis if either was promised separately. Chase the Initial Deposit wire receipt from escrow — failure to fund is grounds for seller's cure-or-terminate. The Additional Deposit auto-triggers when buyer releases the inspection contingency.", rows: [
    { term: "H-1(a)",  due: "", desc: "Verification of Cash Funds",          days: null, unit: "calendar", basis: "attached", auto: false, done: false, comment: "" },
    { term: "H-4(a)",  due: "", desc: "Pre-Qual Letter to Seller",           days: null, unit: "calendar", basis: "attached", auto: false, done: false, comment: "" },
    { term: "C-2",   due: "", desc: "Initial Earnest Money Deposit to Escrow",           days: 2,    unit: "business", basis: "acceptance", auto: true,  done: false, critical: true, comment: "" },
    { term: "C-2",   due: "", desc: "Additional Deposit to Escrow",              days: 2,    unit: "business", basis: "J-1",        auto: true,  done: false, comment: "" }
  ]},
  { title: "Title & Vesting", tc: "Escrow orders the prelim title commitment as soon as it opens. Review carefully for exceptions, easements, encroachments, or judgments — anything seller can't clear puts the deal at risk. Lock down buyer's vesting (JTWROS / TIC / sole / trust) in writing; verbal won't fly with escrow.", rows: [
    { term: "G-1",   due: "", desc: "Title Commitment (Prelim) Delivered", days: 5,    unit: "calendar", basis: "acceptance", auto: true,  done: false, comment: "" },
    { term: "G-3",   due: "", desc: "Buyer's Tenancy & Vesting Determined", days: 10,  unit: "calendar", basis: "acceptance", auto: false, done: false, comment: "" }
  ]},
  { title: "Seller Disclosures (SRPDS)", tc: "SRPDS is seller's mandatory written disclosure under HRS Chapter 508D. Buyer's review window (I-3(b)) is where rescission lives — if seller fails to deliver, that window extends and buyer's rescission rights survive. Lead-Based Paint addendum is a separate HUD-mandated form for pre-1978 homes — track it outside this timeline.", rows: [
    { term: "I-1(b)",  due: "", desc: "SRPDS Delivered to Buyer",            days: 4,    unit: "calendar", basis: "acceptance", auto: true,  done: false, critical: true, comment: "" },
    { term: "I-3(a)",  due: "", desc: "Buyer's Acknowledgement of SRPDS",    days: 2,    unit: "calendar", basis: "I-1",        auto: true,  done: false, comment: "" },
    { term: "I-3(b)",  due: "", desc: "Buyer's Review/Acceptance of SRPDS",  days: 10,   unit: "calendar", basis: "I-1",        auto: true,  done: false, critical: true, comment: "" }
  ]},
  { title: "Survey & HOA / Condo Documents", tc: "K-2 survey is optional — only relevant for fee-simple lots with boundary questions; skip for condos. For HOA / condo / PUD properties, the M-1 packet (CC&Rs, bylaws, board minutes, budget, reserves, pending litigation, house rules) is seller-paid and slow to come back from the managing agent — order the day acceptance lands. Buyer's review/rescission right is the real risk window.", rows: [
    { term: "K-2",   due: "", desc: "Survey Report Delivered to Buyer",    days: 15,   unit: "calendar", basis: "acceptance", auto: true,  done: false, comment: "" },
    { term: "M-1(d)", due: "", desc: "HOA/Community Association/Condo Documents Delivered to Buyer", days: 15, unit: "calendar", basis: "acceptance", auto: true, done: false, comment: "" },
    { term: "M-1(d)", due: "", desc: "Buyer's Acknowledgment of HOA Documents",                       days: 2,  unit: "calendar", basis: "M-1.1",      auto: true, done: false, comment: "" },
    { term: "M-1(e)", due: "", desc: "Buyer's Review/Approval of HOA Documents",                      days: 10, unit: "calendar", basis: "M-1.1",      auto: true, done: false, critical: true, comment: "" }
  ]},
  { title: "Inspection & Termite", tc: "J-1 is the biggest buyer-side de-risk moment — if buyer doesn't release or waive, deposit goes back. Push for one consolidated inspection report (don't let a la carte inspections drag this out). Termite treatment cost falls on seller if infestation is found; treatment can damage plants and finishes, so warn seller early.", rows: [
    { term: "L-2(a)", due: "", desc: "Termite Inspection Company Selected", days: 5,    unit: "calendar", basis: "acceptance", auto: true,  done: false, comment: "" },
    { term: "J-1",   due: "", desc: "Property Inspection Release / Waived", days: 12,  unit: "calendar", basis: "acceptance", auto: false, done: false, critical: true, comment: "" },
    { term: "L-2(b)", due: "", desc: "Termite Inspection Report Due to Buyer", days: 15, unit: "calendar", basis: "closing",    auto: true,  done: false, comment: "" }
  ]},
  { title: "Loan", tc: "H-4(c) (satisfaction of all loan conditions) is the de-facto Clear-to-Close gate — there is no separate CTC milestone in HAR. Stay in weekly contact with the lender; underwriting surprises late in escrow are the #1 cause of delayed closings. If lender slips, flag Daniel immediately so we can prep an extension addendum.", rows: [
    { term: "H-4(b)",  due: "", desc: "Conditional Loan Commitment Letter Delivered to Seller", days: 15, unit: "calendar", basis: "closing", auto: true, done: false, critical: true, comment: "" },
    { term: "H-4(c)",  due: "", desc: "Satisfaction of Conditional Loan Commitment Letter",     days: 10, unit: "calendar", basis: "closing", auto: true, done: false, critical: true, comment: "" }
  ]},
  { title: "Pre-Close & Closing", tc: "Sequence matters: items out → professional clean → final walk-through. Each task is a contract obligation per J-3/J-8/J-9(a) — if seller misses, 150% of estimated remediation cost gets withheld from proceeds per J-4. Confirm seller signs deed in advance if traveling. Wire instructions verified by phone only — never email.", rows: [
    { term: "J-8",   due: "", desc: "Removal of Items from Property",                            days: 7, unit: "calendar", basis: "closing", auto: true, done: false, comment: "" },
    { term: "J-9(a)", due: "", desc: "Seller to Have Interior of Improvements Cleaned",           days: 6, unit: "calendar", basis: "closing", auto: true, done: false, comment: "" },
    { term: "J-3",   due: "", desc: "Final Walk-Thru",                                           days: 5, unit: "calendar", basis: "closing", auto: false, done: false, critical: true, comment: "" },
    { term: "F-2",   due: "", desc: "Scheduled Closing Date",                                    days: 45, unit: "calendar", basis: "acceptance", auto: false, done: false, critical: true, comment: "" }
  ]}
];

// Listing-side variant — IDENTICAL rows (same transaction, same dates), only TC directions are
// re-written from the seller-rep angle. Keep row arrays in sync with defaultBuyerSections.
const defaultSellerSections = [
  { title: "Opening & Deposits", tc: "Verify buyer's H-1(a) (cash funds evidence) and H-4(a) (pre-qual) — both protect seller from a buyer who can't actually close. Earnest money not hitting escrow on time is grounds for cure-or-terminate notice under O-3. Additional Deposit triggers when buyer releases the inspection contingency.", rows: [
    { term: "H-1(a)",  due: "", desc: "Verification of Cash Funds (received w/PC)", days: null, unit: "calendar", basis: "attached", auto: false, done: false, comment: "" },
    { term: "H-4(a)",  due: "", desc: "Pre-Qual Letter Received from Buyer",        days: null, unit: "calendar", basis: "attached", auto: false, done: false, comment: "" },
    { term: "C-2",   due: "", desc: "Buyer's Initial Earnest Money Received by Escrow", days: 2,    unit: "business", basis: "acceptance", auto: true,  done: false, critical: true, comment: "" },
    { term: "C-2",   due: "", desc: "Buyer's Additional Deposit Received",          days: 2,    unit: "business", basis: "J-1",        auto: true,  done: false, comment: "" }
  ]},
  { title: "Title & Vesting", tc: "Title clouds are seller's problem to fix — liens, child support, alimony, mechanic's liens, lis pendens, unresolved permits, undisclosed easements. Surface every issue immediately to seller so cure work starts early. Buyer's vesting is informational on this side; just confirm escrow has it before docs are drawn.", rows: [
    { term: "G-1",   due: "", desc: "Title Commitment (Prelim) Delivered",        days: 5,  unit: "calendar", basis: "acceptance", auto: true,  done: false, comment: "" },
    { term: "G-3",   due: "", desc: "Buyer's Tenancy & Vesting Determined",       days: 10, unit: "calendar", basis: "acceptance", auto: false, done: false, comment: "" }
  ]},
  { title: "Seller Disclosures (SRPDS)", tc: "This is SELLER'S mandatory disclosure under HRS Chapter 508D — chase signatures hard. Required addenda: Lead-Based Paint (pre-1978), photovoltaic system docs, security alarm docs, rental docs if tenanted. Late or incomplete delivery extends buyer's rescission window and creates liability exposure for seller under 508D-9 if disclosures aren't in good faith.", rows: [
    { term: "I-1(b)",  due: "", desc: "SRPDS Delivered to Buyer",                   days: 4,  unit: "calendar", basis: "acceptance", auto: true,  done: false, critical: true, comment: "" },
    { term: "I-3(a)",  due: "", desc: "Buyer's Acknowledgement Received",           days: 2,  unit: "calendar", basis: "I-1",        auto: true,  done: false, comment: "" },
    { term: "I-3(b)",  due: "", desc: "Buyer's Review/Acceptance of SRPDS",         days: 10, unit: "calendar", basis: "I-1",        auto: true,  done: false, critical: true, comment: "" }
  ]},
  { title: "Survey & HOA / Condo Documents", tc: "Survey (K-2) and the full HOA/condo packet are seller-paid. Order the M-1 resale package the day acceptance lands — managing agents are slow. Track the buyer's acknowledgement and rescission windows tightly; this is the second-most-common deal-killer after financing.", rows: [
    { term: "K-2",   due: "", desc: "Survey Report Delivered to Buyer",           days: 15, unit: "calendar", basis: "acceptance", auto: true, done: false, comment: "" },
    { term: "M-1(d)", due: "", desc: "HOA/Community Association/Condo Documents Delivered to Buyer", days: 15, unit: "calendar", basis: "acceptance", auto: true, done: false, comment: "" },
    { term: "M-1(d)", due: "", desc: "Buyer's Acknowledgment Received",                              days: 2,  unit: "calendar", basis: "M-1.1",      auto: true, done: false, comment: "" },
    { term: "M-1(e)", due: "", desc: "Buyer's Review/Approval Window Closes",                        days: 10, unit: "calendar", basis: "M-1.1",      auto: true, done: false, critical: true, comment: "" }
  ]},
  { title: "Inspection & Termite", tc: "Provide buyer's inspector reasonable access (lockbox or by-appointment per contract). J-1 release is the big de-risking moment for the listing — once it's gone, deposit becomes harder to claw back. If buyer requests repairs, seller's response is a negotiation, not an obligation; coach seller on cost-vs-relist tradeoffs. Termite treatment is seller-paid if infestation is found.", rows: [
    { term: "L-2(a)", due: "", desc: "Termite Inspection Company Selected",        days: 5,  unit: "calendar", basis: "acceptance", auto: true, done: false, comment: "" },
    { term: "J-1",   due: "", desc: "Buyer's Inspection Release / Waiver",        days: 12, unit: "calendar", basis: "acceptance", auto: false, done: false, critical: true, comment: "" },
    { term: "L-2(b)", due: "", desc: "Termite Inspection Report Due to Buyer",     days: 15, unit: "calendar", basis: "closing",    auto: true,  done: false, comment: "" }
  ]},
  { title: "Loan", tc: "Buyer-side milestones we monitor only — but they're the leading cause of blown closings. If the Conditional Loan Commitment Letter slips, that's a yellow flag; if satisfaction-of-conditions slips, prep seller for a potential extension request or, worst case, terminate-and-retain-deposit conversation. Verify with the buyer's lender directly — don't rely on the buyer's agent for status.", rows: [
    { term: "H-4(b)",  due: "", desc: "Conditional Loan Commitment Letter Received from Buyer", days: 15, unit: "calendar", basis: "closing", auto: true, done: false, critical: true, comment: "" },
    { term: "H-4(c)",  due: "", desc: "Buyer Satisfies CLCL Conditions",                        days: 10, unit: "calendar", basis: "closing", auto: true, done: false, critical: true, comment: "" }
  ]},
  { title: "Pre-Close & Closing", tc: "Walk seller through every pre-close obligation: clear all items (J-8), professionally clean interior (J-9), provide access for buyer's walk-through (J-3). Failure to deliver = 150% withholding from seller proceeds per J-4. Confirm seller signs deed in advance if traveling. Verify wire instructions by phone with escrow — fraud is rampant in this stage.", rows: [
    { term: "J-8",   due: "", desc: "Removal of Items from Property",                            days: 7,  unit: "calendar", basis: "closing", auto: true, done: false, comment: "" },
    { term: "J-9(a)", due: "", desc: "Seller to Have Interior of Improvements Cleaned",           days: 6,  unit: "calendar", basis: "closing", auto: true, done: false, comment: "" },
    { term: "J-3",   due: "", desc: "Final Walk-Thru (Buyer)",                                   days: 5,  unit: "calendar", basis: "closing", auto: false, done: false, critical: true, comment: "" },
    { term: "F-2",   due: "", desc: "Scheduled Closing Date",                                    days: 45, unit: "calendar", basis: "acceptance", auto: false, done: false, critical: true, comment: "" }
  ]}
];

function TimelineSection({ sectionIdx, section, go, showTC, cascadedKeys, onRowChange }) {
  const doneCount = section.rows.filter(r => r.done).length;
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ background: "var(--ink)", color: "#fff", padding: "11px 22px", borderRadius: "8px 8px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{section.title}</div>
        <div style={{ fontSize: 11, color: "#A8A4A0" }}>{section.rows.length} items · {doneCount} done</div>
      </div>
      {showTC && section.tc && (
        <div className="tc-note" style={{ borderRadius: 0, margin: 0, borderLeftWidth: 4 }}>
          <strong>📋 TC Directions:</strong> {section.tc}
        </div>
      )}
      <div className="scroll-x" style={{ borderRadius: "0 0 8px 8px", overflow: "auto", border: "1px solid var(--line)", borderTop: "none" }}>
        <table className="tl-section-table" style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
          <thead>
            <tr style={{ background: "#FAFAF8" }}>
              <th style={th}>Term</th>
              <th style={th}>Due Date</th>
              <th style={{ ...th, width: "32%" }}>Description</th>
              <th style={th}>Contingency Timing</th>
              <th style={{ ...th, width: 60, textAlign: "center" }}>Done</th>
              <th style={{ ...th, width: "24%" }}>Comments</th>
            </tr>
          </thead>
          <tbody>
            {section.rows.map((r, i) => (
              <TimelineRow
                key={r.term + "-" + i}
                row={r}
                go={go}
                cascaded={cascadedKeys && cascadedKeys.has(`${sectionIdx}:${i}`)}
                onChange={partial => onRowChange(i, partial)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = { textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--ink-3)", padding: "10px 14px", borderBottom: "1px solid var(--line)" };
const td = { padding: "12px 14px", fontSize: 13, color: "var(--ink-2)", borderBottom: "1px solid var(--line-2)", verticalAlign: "middle" };

function TimelineRow({ row, go, onChange, cascaded }) {
  const [justChecked, setJustChecked] = useState(false);
  const justCheckedTimer = React.useRef(null);

  const handleCheck = (val) => {
    onChange({ done: val });
    if (val && !row.done) {
      setJustChecked(true);
      clearTimeout(justCheckedTimer.current);
      justCheckedTimer.current = setTimeout(() => setJustChecked(false), 4000);
    }
  };

  // Handle a direct date edit. On the first auto→manual transition for this row,
  // stamp the comment field with the original auto-calculated date so there's an
  // audit trail for amendments (e.g. seller redelivered SRPDS — original was 4/12,
  // now 4/18). Subsequent manual edits don't re-stamp.
  const handleDateOverride = (v) => {
    const patch = { due: v, manual: true };
    const wasAuto = !row.manual;
    const prevDue = row.due;
    if (wasAuto && prevDue && prevDue !== v) {
      const today = formatDateShort(new Date());
      const stamp = `Overridden ${today} · was ${prevDue}`;
      patch.comment = row.comment ? `${stamp} — ${row.comment}` : stamp;
    }
    onChange(patch);
  };

  const dotColor = row.critical ? "var(--red)" : row.current ? "var(--red)" : "var(--ink-3)";
  const rowBg = justChecked ? "rgba(31,138,76,0.08)" : row.current ? "rgba(179,32,37,0.04)" : "transparent";

  // Cascade flash takes precedence over the static row background
  const trStyle = cascaded
    ? { transition: "background 0.3s" }
    : { background: rowBg, transition: "background 0.3s" };

  return (
    <tr className={cascaded ? "cascade-flash" : ""} style={trStyle}>
      <td style={td}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor }} />
          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--ink)", fontSize: 12 }}>{row.term}</span>
          {row.current && <Chip tone="red">Current</Chip>}
        </div>
      </td>
      <td style={td}>
        {row.basis === "attached" ? (
          <span style={{ fontSize: 12, color: "var(--ink-4)" }}>—</span>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <DatePickerField
              compact
              value={row.due}
              onChange={handleDateOverride}
            />
            {row.manual ? (
              <button
                onClick={() => onChange({ manual: false })}
                title="Revert to auto-calculated date from anchor + days"
                style={{
                  fontSize: 9.5, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase",
                  color: "#fff", background: "var(--amber)",
                  border: "1px solid var(--amber)", borderRadius: 3, padding: "2px 6px",
                  cursor: "pointer", whiteSpace: "nowrap"
                }}
              >✎ Override ↺</button>
            ) : (
              <span title="Auto-calculated from basis" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "#6A8EBD" }}>auto</span>
            )}
          </div>
        )}
      </td>
      <td style={td}>
        <input
          value={row.desc}
          onChange={e => onChange({ desc: e.target.value })}
          style={{ background: "transparent", border: "none", outline: "none", padding: 0, fontSize: 13, color: "var(--ink-2)", width: "100%" }}
        />
      </td>
      <td style={td}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {row.basis !== "attached" && (
            <React.Fragment>
              <input
                type="number"
                value={row.days ?? ""}
                onChange={e => onChange({ days: e.target.value === "" ? null : +e.target.value })}
                style={{ width: 48, padding: "6px 8px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 12 }}
              />
              <select
                value={row.unit}
                onChange={e => onChange({ unit: e.target.value })}
                style={{ padding: "6px 4px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 12, background: "#fff" }}
              >
                <option value="business">bus.</option>
                <option value="calendar">cal.</option>
              </select>
              <span style={{ fontSize: 11.5, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                {row.basis === "closing" ? "prior to" : "from"}
              </span>
            </React.Fragment>
          )}
          <select
            value={row.basis}
            onChange={e => {
              const newBasis = e.target.value;
              const patch = { basis: newBasis };
              // Switching INTO attached: clear day count
              if (newBasis === "attached") patch.days = null;
              // Switching OUT of attached: seed a sensible default if no days yet
              if (row.basis === "attached" && newBasis !== "attached" && row.days == null) {
                patch.days = newBasis === "closing" ? 10 : 5;
                patch.unit = row.unit || "calendar";
              }
              onChange(patch);
            }}
            style={{
              padding: "6px 8px", border: "1px solid var(--line)", borderRadius: 4,
              fontSize: 12, fontWeight: row.basis === "attached" ? 700 : 400,
              background: row.basis === "attached" ? "var(--gold-wash)" : "#fff",
              color: row.basis === "attached" ? "#6B4E10" : "var(--ink-2)"
            }}
          >
            <option value="acceptance">After Acceptance</option>
            <option value="closing">Before Closing</option>
            <option value="I-1">After SRPDS Delivered · I-1(b)</option>
            <option value="M-1.1">After HOA Docs Delivered · M-1(d)</option>
            <option value="J-1">After Inspection Release · J-1</option>
            <option value="attached">Attached w/PC</option>
          </select>
          {row.basis !== "attached" && (
            <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1, color: "#fff", background: row.auto ? "#6A8EBD" : "#8A7A6B", padding: "3px 6px", borderRadius: 3 }}>{row.auto ? "AUTO" : "MANUAL"}</span>
          )}
        </div>
      </td>
      <td style={{ ...td, textAlign: "center" }}>
        <Check checked={row.done} onChange={handleCheck} />
      </td>
      <td style={td}>
        <input
          value={row.comment || ""}
          onChange={e => onChange({ comment: e.target.value })}
          placeholder="Add note…"
          style={{ background: "transparent", border: "1px dashed transparent", borderRadius: 4, padding: "4px 8px", fontSize: 12, color: row.comment ? "var(--ink)" : "var(--ink-4)", outline: "none", width: "100%" }}
          onFocus={e => e.currentTarget.style.border = "1px dashed var(--line)"}
          onBlur={e => e.currentTarget.style.border = "1px dashed transparent"}
        />
      </td>
    </tr>
  );
}

window.TimelineEditor = TimelineEditor;

function SideSwitch({ side, go, txId }) {
  const isSeller = side === "seller";
  const item = (label, val, active) => (
    <button onClick={() => {
      const q = {};
      if (txId) q.id = txId;
      if (val === "seller") q.side = "seller";
      go("/admin/timeline", q);
    }} style={{
      padding: "6px 14px", fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase",
      background: active ? "#fff" : "transparent",
      color: active ? "var(--red)" : "rgba(255,255,255,0.85)",
      borderRadius: 4, transition: "all 0.12s"
    }}>{label}</button>
  );
  return (
    <div style={{ display: "inline-flex", padding: 3, background: "rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 6 }}>
      {item("Buyer-Side", "buyer", !isSeller)}
      {item("Listing-Side", "seller", isSeller)}
    </div>
  );
}

window.SideSwitch = SideSwitch;

// ─── PDF EXPORT ─────────────────────────────────────────────────────────────
// Uses jsPDF (loaded via CDN in index.html) for cross-platform PDF output.
// Falls back to window.print() if jsPDF isn't available (offline / blocked).
// Normalize Hawaiian + other non-Latin1 chars so jsPDF's built-in helvetica
// doesn't produce garbled glyphs.
function pdfSafe(s) {
  if (s == null) return "";
  return String(s)
    .replace(/[ʻʼ‘’]/g, "'")
    .replace(/[ā]/g, "a").replace(/[Ā]/g, "A")
    .replace(/[ē]/g, "e").replace(/[Ē]/g, "E")
    .replace(/[ī]/g, "i").replace(/[Ī]/g, "I")
    .replace(/[ō]/g, "o").replace(/[Ō]/g, "O")
    .replace(/[ū]/g, "u").replace(/[Ū]/g, "U")
    .replace(/[—–]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/·/g, "•")
    .replace(/[^\x20-\x7E]/g, ""); // strip any remaining non-ASCII
}

// Map a row's term code to its position on the 6-stop milestone rail.
// Mirrors the editor's milestone hierarchy: Acceptance → Disclosures → Inspection → Loan → Walkthrough → Closing.
function milestoneStops(s) {
  const findRow = (term) => {
    for (const sec of (s.sections || [])) {
      const r = sec.rows.find(r => r.term === term);
      if (r) return r;
    }
    return null;
  };
  const I3b = findRow("I-3(b)");
  const J1  = findRow("J-1");
  const H4b = findRow("H-4(b)");
  const J3  = findRow("J-3");
  const F2  = findRow("F-2");

  // Mark the first not-done milestone as "current"
  const stops = [
    { label: "Acceptance",  date: s.acceptance || "—",  done: !!s.acceptance },
    { label: "Disclosures", date: I3b?.due || "—",       done: !!I3b?.done },
    { label: "Inspection",  date: J1?.due  || "—",       done: !!J1?.done  },
    { label: "Loan Comm.",  date: H4b?.due || "—",       done: !!H4b?.done },
    { label: "Walkthrough", date: J3?.due  || "—",       done: !!J3?.done  },
    { label: "Closing",     date: s.closing || F2?.due || "—", done: !!F2?.done },
  ];
  const firstPending = stops.findIndex(x => !x.done);
  if (firstPending > 0) stops[firstPending].current = true;
  return stops;
}

function exportTimelinePDF(s, side, isSeller) {
  const { jsPDF } = window.jspdf;
  // Portrait Letter — single page.
  const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();   // 612pt
  const pageH = doc.internal.pageSize.getHeight();  // 792pt
  const M = 30;
  const contentW = pageW - M * 2;

  // Color palette — matches editor CSS variables
  const RED = [179, 32, 37];
  const RED_INK = [138, 24, 28];
  const RED_WASH = [251, 236, 236];
  const INK = [20, 17, 15];
  const INK_2 = [55, 51, 48];
  const INK_3 = [122, 118, 114];
  const MUTED = [120, 116, 110];
  const LINE = [225, 222, 218];
  const LINE_2 = [239, 237, 235];
  const ZEBRA = [250, 249, 246];
  const GREEN = [31, 138, 76];
  const AMBER = [201, 132, 22];

  // ── HEADER BAR (red, with logo top-left) ────────────────────────────
  const headerH = 56;
  doc.setFillColor(...RED); doc.rect(0, 0, pageW, headerH, "F");

  // Logo top-left — uses the embedded white-variant data URL when available,
  // falls back to a typographic mark if the image isn't ready or fails to render.
  let logoDrawn = false;
  const logoSrc = (typeof window !== "undefined") && (window.__ULU_WHITE_LOGO__ || window.__ULU_COLOR_LOGO__);
  if (logoSrc && typeof logoSrc === "string" && logoSrc.startsWith("data:image/")) {
    try {
      // White logo is roughly 740×270 aspect (~2.74:1). Lock height, derive width.
      const logoH = 30;
      const logoW = logoH * 2.74;
      doc.addImage(logoSrc, "PNG", M, (headerH - logoH) / 2, logoW, logoH, undefined, "FAST");
      logoDrawn = true;
    } catch (e) { /* fall through to text logo */ }
  }
  if (!logoDrawn) {
    doc.setFont("helvetica", "bold").setFontSize(15).setTextColor(255, 255, 255);
    doc.text("THE ULU TEAM", M, 24);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(255, 220, 222);
    doc.text("Real Estate Services with Aloha", M, 36);
  }

  // Right side of header — title eyebrow + generated date
  doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(245, 184, 186);
  doc.text(pdfSafe(isSeller ? "LISTING-SIDE TIMELINE" : "BUYER-SIDE TIMELINE"), pageW - M, 22, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(255, 255, 255);
  const stamp = "Generated " + new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  doc.text(pdfSafe(stamp), pageW - M, 36, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(245, 184, 186);
  doc.text("Keller Williams Honolulu  •  RB-21303", pageW - M, 47, { align: "right" });

  let y = headerH + 12;

  // ── BLACK DATE STRIP (mirrors the editor's date bar) ────────────────
  const stripH = 52;
  doc.setFillColor(...INK); doc.rect(M, y, contentW, stripH, "F");

  // Eyebrow + property address (left side)
  doc.setFont("helvetica", "bold").setFontSize(6.5).setTextColor(168, 164, 160);
  doc.text("PROPERTY", M + 14, y + 14);
  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(255, 255, 255);
  const addr = pdfSafe(s.property || "—");
  const addrLines = doc.splitTextToSize(addr, contentW * 0.45);
  doc.text(addrLines[0] || "—", M + 14, y + 28);
  doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(168, 164, 160);
  const subParts = [];
  if (s.escrow) subParts.push("Escrow " + s.escrow);
  if (s.leadAgent) subParts.push("Lead Agent: " + s.leadAgent);
  doc.text(pdfSafe(subParts.join("   •   ") || "—"), M + 14, y + 42);

  // Date pills (right side) — Acceptance, Closing
  const pillW = 90;
  const pillGap = 8;
  const pillsX = M + contentW - (pillW * 2 + pillGap) - 12;
  const drawPill = (label, val, x, accent) => {
    if (accent) {
      doc.setFillColor(...RED); doc.rect(x, y + 10, pillW, stripH - 20, "F");
    } else {
      doc.setDrawColor(80, 76, 72); doc.setLineWidth(0.6);
      doc.rect(x, y + 10, pillW, stripH - 20, "S");
    }
    doc.setFont("helvetica", "bold").setFontSize(6.5).setTextColor(...(accent ? [255, 220, 222] : [168, 164, 160]));
    doc.text(label.toUpperCase(), x + 8, y + 23);
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(255, 255, 255);
    doc.text(pdfSafe(val || "—"), x + 8, y + 38);
  };
  drawPill("Acceptance", s.acceptance, pillsX, false);
  drawPill("Closing", s.closing, pillsX + pillW + pillGap, true);

  y += stripH + 10;

  // ── MILESTONE RAIL (matches editor) ─────────────────────────────────
  const stops = milestoneStops(s);
  const railTop = y;
  const railH = 42;
  // Rail line
  const dotR = 5;
  const railY = railTop + 10;
  const railLineL = M + 24;
  const railLineR = pageW - M - 24;
  doc.setDrawColor(...RED); doc.setLineWidth(1.2);
  // Dashed-ish soft line: just a low-alpha-equivalent gray-red blend
  doc.setDrawColor(231, 173, 175);
  doc.line(railLineL, railY, railLineR, railY);

  const stopGap = (railLineR - railLineL) / (stops.length - 1);
  stops.forEach((st, i) => {
    const cx = railLineL + stopGap * i;
    // Dot
    if (st.done) {
      doc.setFillColor(...RED); doc.setDrawColor(255, 255, 255); doc.setLineWidth(1.2);
      doc.circle(cx, railY, dotR, "FD");
    } else if (st.current) {
      doc.setFillColor(...RED); doc.setDrawColor(...RED_WASH); doc.setLineWidth(2);
      doc.circle(cx, railY, dotR, "FD");
    } else {
      doc.setFillColor(255, 255, 255); doc.setDrawColor(217, 214, 210); doc.setLineWidth(1);
      doc.circle(cx, railY, dotR, "FD");
    }
    // Label
    doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(...(st.current ? RED : INK));
    doc.text(pdfSafe(st.label), cx, railY + 16, { align: "center", maxWidth: stopGap - 4 });
    // Date
    doc.setFont("helvetica", "normal").setFontSize(6.5).setTextColor(...MUTED);
    doc.text(pdfSafe(st.date), cx, railY + 26, { align: "center" });
  });

  y = railTop + railH + 6;

  // ── PARTIES + PROGRESS (single compact row) ─────────────────────────
  const roleLabels = { seller: "Seller", buyer: "Buyer", sellerAgent: "Listing Agent", buyerAgent: "Buyer Agent" };
  const parties = (s.parties || []).filter(p => p.name);
  const sections = s.sections || [];
  const totalRows = sections.reduce((n, sec) => n + sec.rows.length, 0);
  const doneRows = sections.reduce((n, sec) => n + sec.rows.filter(r => r.done).length, 0);

  // Card container
  const partyBoxH = 38;
  doc.setFillColor(252, 251, 248); doc.setDrawColor(...LINE); doc.setLineWidth(0.5);
  doc.roundedRect(M, y, contentW, partyBoxH, 3, 3, "FD");

  // Left half: parties (compact two-column grid)
  doc.setFont("helvetica", "bold").setFontSize(6.5).setTextColor(...MUTED);
  doc.text("PARTIES", M + 10, y + 11);
  const partyAreaW = contentW * 0.62;
  const partyColW = (partyAreaW - 20) / 2;
  parties.slice(0, 4).forEach((p, i) => {
    const col = i % 2;
    const rowIdx = Math.floor(i / 2);
    const px = M + 10 + col * partyColW;
    const py = y + 19 + rowIdx * 10;
    doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(...INK_3);
    const roleLabel = (roleLabels[p.role] || p.role) + ":";
    doc.text(pdfSafe(roleLabel), px, py);
    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...INK);
    const nameMax = partyColW - 50;
    const truncName = (() => {
      const n = pdfSafe(p.name);
      if (doc.getTextWidth(n) <= nameMax) return n;
      let t = n;
      while (t.length > 4 && doc.getTextWidth(t + "...") > nameMax) t = t.slice(0, -1);
      return t + "...";
    })();
    doc.text(truncName, px + 46, py);
  });

  // Right half: progress
  const progX = M + contentW - contentW * 0.32 - 10;
  const progW = contentW * 0.32;
  doc.setFont("helvetica", "bold").setFontSize(6.5).setTextColor(...MUTED);
  doc.text("PROGRESS", progX, y + 11);
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...INK);
  doc.text(pdfSafe(`${doneRows} of ${totalRows}`), progX + progW, y + 11, { align: "right" });
  // Bar
  const barY = y + 17;
  doc.setFillColor(240, 238, 234); doc.rect(progX, barY, progW, 5, "F");
  if (totalRows > 0) {
    doc.setFillColor(...RED);
    doc.rect(progX, barY, (doneRows / totalRows) * progW, 5, "F");
  }
  // Pct
  doc.setFont("helvetica", "normal").setFontSize(6.5).setTextColor(...MUTED);
  const pct = totalRows > 0 ? Math.round((doneRows / totalRows) * 100) : 0;
  doc.text(`${pct}% complete`, progX, y + 32);
  if (s.closing) {
    doc.text(pdfSafe(`Closes ${s.closing}`), progX + progW, y + 32, { align: "right" });
  }

  y += partyBoxH + 8;

  // ── CONTINGENCY TABLE ──────────────────────────────────────────────
  const footerY = pageH - 22;
  const availableH = footerY - y - 8;
  // Each section: header + rows. Scale to fit one page.
  const totalUnits = sections.length * 13 + totalRows * 12;
  const scale = Math.min(1, availableH / totalUnits);
  const rowH = 12 * scale;
  const secH = 13 * scale;
  const rowFontSize = scale >= 0.95 ? 8 : scale >= 0.85 ? 7.5 : scale >= 0.75 ? 7 : 6.5;
  const secFontSize = scale >= 0.9 ? 8 : 7.5;

  // Column layout: dot • Term • Due • Description • Status
  const colDot = M + 6;
  const colTerm = M + 16;
  const colDue = M + 56;
  const colDesc = M + 112;
  const colDone = pageW - M - 16;
  const descW = colDone - colDesc - 10;

  sections.forEach((sec, si) => {
    // Section header bar (dark)
    doc.setFillColor(...INK);
    doc.rect(M, y, contentW, secH, "F");
    // Section title
    doc.setFont("helvetica", "bold").setFontSize(secFontSize).setTextColor(255, 255, 255);
    doc.text(pdfSafe(sec.title.toUpperCase()), M + 10, y + secH - 4);
    // Count badge on right
    const secDone = sec.rows.filter(r => r.done).length;
    const allDone = secDone === sec.rows.length && sec.rows.length > 0;
    doc.setFont("helvetica", "bold").setFontSize(6.5);
    doc.setTextColor(...(allDone ? [180, 255, 200] : [255, 220, 222]));
    doc.text(`${secDone}/${sec.rows.length}`, pageW - M - 8, y + secH - 4, { align: "right" });
    y += secH;

    // Rows
    sec.rows.forEach((r, i) => {
      // Zebra striping
      if (i % 2 === 1) {
        doc.setFillColor(...ZEBRA);
        doc.rect(M, y, contentW, rowH, "F");
      }
      // Bottom hairline separator
      doc.setDrawColor(...LINE_2); doc.setLineWidth(0.3);
      doc.line(M, y + rowH, pageW - M, y + rowH);

      // Critical / current dot (left margin)
      const dotColor = r.critical ? RED : r.current ? RED : [168, 164, 160];
      doc.setFillColor(...dotColor);
      doc.circle(colDot, y + rowH / 2, 1.8, "F");

      // Term (red, mono-feel)
      doc.setFont("helvetica", "bold").setFontSize(rowFontSize).setTextColor(...RED_INK);
      doc.text(pdfSafe(r.term || ""), colTerm, y + rowH - 3);

      // Due date (or w/PC tag for attached)
      const isAttached = r.basis === "attached";
      if (isAttached) {
        doc.setFont("helvetica", "bold").setFontSize(rowFontSize - 0.5).setTextColor(...AMBER);
        doc.text("w/PC", colDue, y + rowH - 3);
      } else {
        doc.setFont("helvetica", "normal").setFontSize(rowFontSize).setTextColor(...INK);
        doc.text(pdfSafe(r.due || "—"), colDue, y + rowH - 3);
      }

      // Description (truncate, with strikethrough if done)
      doc.setFont("helvetica", r.critical ? "bold" : "normal").setFontSize(rowFontSize);
      doc.setTextColor(...(r.done ? MUTED : INK_2));
      const descLines = doc.splitTextToSize(pdfSafe(r.desc || ""), descW);
      doc.text(descLines[0] || "", colDesc, y + rowH - 3);
      if (r.done) {
        const dWidth = doc.getTextWidth(descLines[0] || "");
        doc.setDrawColor(...MUTED); doc.setLineWidth(0.4);
        doc.line(colDesc, y + rowH - 5, colDesc + dWidth, y + rowH - 5);
      }

      // Done indicator (right)
      if (r.done) {
        doc.setFillColor(...GREEN); doc.setDrawColor(...GREEN);
        doc.circle(colDone + 4, y + rowH / 2, 3.2, "F");
        // Checkmark stroke
        doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.8);
        doc.line(colDone + 2.2, y + rowH / 2 + 0.2, colDone + 3.6, y + rowH / 2 + 1.6);
        doc.line(colDone + 3.6, y + rowH / 2 + 1.6, colDone + 5.8, y + rowH / 2 - 1.2);
      } else {
        doc.setDrawColor(201, 197, 192); doc.setLineWidth(0.7);
        doc.circle(colDone + 4, y + rowH / 2, 3.2, "S");
      }
      y += rowH;
    });
  });

  // ── FOOTER ─────────────────────────────────────────────────────────
  doc.setDrawColor(...LINE); doc.setLineWidth(0.5);
  doc.line(M, footerY - 8, pageW - M, footerY - 8);
  doc.setFont("helvetica", "italic").setFontSize(6.5).setTextColor(...MUTED);
  doc.text("Internal working document — the executed Purchase Contract and its addenda control.", M, footerY - 1);
  doc.setFont("helvetica", "normal").setFontSize(6.5).setTextColor(...INK_3);
  doc.text("theuluteam.com  •  daniel@uluteam.com  •  808-295-8157", pageW - M, footerY - 1, { align: "right" });

  // ── SAVE ───────────────────────────────────────────────────────────
  const slug = pdfSafe(s.property || "untitled").replace(/[^a-z0-9]/gi, "-").replace(/-+/g, "-").slice(0, 40).toLowerCase();
  doc.save(`ulu-timeline-${slug}-${new Date().toISOString().slice(0,10)}.pdf`);
}
window.exportTimelinePDF = exportTimelinePDF;
window.getInitialSideState = getInitialSideState;

window.sellerSections = defaultSellerSections;
// Back-compat for any other screen still importing the old name:
window.sections = defaultBuyerSections;
