// timeline_print.jsx — buyer-friendly one-page summary
// Hidden onscreen, shown only in @media print. Use window.print() to render.

function TimelinePrint({ side = "buyer", property, parties, dates, sections }) {
  const isSeller = side === "seller";
  const total = sections.reduce((n, s) => n + s.rows.length, 0);
  const done = sections.reduce((n, s) => n + s.rows.filter(r => r.done).length, 0);
  const pct = Math.round((done / total) * 100);

  // Flatten + sort all rows by due date for a single chronological table view
  const allRows = sections.flatMap(s => s.rows.map(r => ({ ...r, section: s.title })));

  // Find current milestone index
  const findRow = (term) => {
    for (const sec of sections) {
      const r = sec.rows.find(r => r.term === term);
      if (r) return r;
    }
    return null;
  };
  const I3b = findRow("I-3(b)");
  const J1  = findRow("J-1");
  const H4b = findRow("H-4(b)");
  const H4c = findRow("H-4(c)");
  const F2  = findRow("F-2");
  const milestones = [
    { label: "Acceptance",       date: dates.acceptance || "—", done: !!dates.acceptance },
    { label: "Disclosures",      date: I3b?.due || "—",         done: !!I3b?.done },
    { label: "Inspection",       date: J1?.due  || "—",         done: !!J1?.done },
    { label: "Loan Commitment",  date: H4b?.due || "—",         done: !!H4b?.done, current: !!H4b && !H4b.done && !!I3b?.done },
    { label: "Clear to Close",   date: H4c?.due || "—",         done: !!H4c?.done },
    { label: "Closing",          date: dates.closing || F2?.due || "—", done: !!F2?.done }
  ];

  return (
    <div className="print-only" id="timeline-print">
      {/* PAGE 1 — Cover summary */}
      <section className="print-page">
        <header className="print-head">
          <div className="print-head-left">
            <UluLogo height={48} variant="black" />
            <div className="print-head-divider" />
            <div>
              <div className="print-eyebrow">Transaction Timeline</div>
              <div className="print-head-title">{isSeller ? "Seller Summary" : "Buyer Summary"}</div>
            </div>
          </div>
          <div className="print-head-right">
            <div className="print-eyebrow">Prepared</div>
            <div className="print-head-date">{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
          </div>
        </header>

        {/* Property card */}
        <div className="print-property">
          <div className="print-property-main">
            <div className="print-eyebrow">Property</div>
            <div className="print-property-addr">{property.address}</div>
            <div className="print-property-meta">Escrow #{property.escrow}</div>
          </div>
          <div className="print-property-dates">
            <div>
              <div className="print-eyebrow">Acceptance</div>
              <div className="print-dl">{dates.acceptance || "—"}</div>
            </div>
            <div>
              <div className="print-eyebrow">Contract Ref</div>
              <div className="print-dl">{dates.contractRef || "—"}</div>
            </div>
            <div className="print-closing-cell">
              <div className="print-eyebrow" style={{ color: "#F5B8BA" }}>Closing</div>
              <div className="print-dl" style={{ color: "#fff" }}>{dates.closing || "—"}</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="print-progress-block">
          <div className="print-progress-head">
            <span className="print-eyebrow">Progress</span>
            <span className="print-progress-stat">{done} of {total} milestones complete · {pct}%</span>
          </div>
          <div className="print-progress-bar">
            <div className="print-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="print-milestones">
            {milestones.map((m, i) => (
              <div key={i} className={`print-milestone ${m.done ? "done" : ""} ${m.current ? "current" : ""}`}>
                <div className="print-milestone-dot" />
                <div className="print-milestone-label">{m.label}</div>
                <div className="print-milestone-date">{m.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Parties */}
        <div className="print-parties">
          <div className="print-eyebrow" style={{ marginBottom: 10 }}>Parties</div>
          <div className="print-parties-grid">
            {parties.map((p, i) => (
              <div key={i} className={`print-party ${p.highlight ? "highlight" : ""}`}>
                <div className="print-party-role">{p.label}</div>
                <div className="print-party-name">{p.name}</div>
                <div className="print-party-contact">{p.email}</div>
                <div className="print-party-contact">{p.phone}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PAGE 2+ — Detail sections */}
      {sections.map((s, i) => (
        <section key={i} className="print-section">
          <h2 className="print-section-head">{s.title}</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: "9%" }}>Term</th>
                <th style={{ width: "13%" }}>Due</th>
                <th style={{ width: "44%" }}>Description</th>
                <th style={{ width: "10%" }}>Status</th>
                <th style={{ width: "24%" }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {s.rows.map((r, j) => (
                <tr key={j} className={r.critical ? "critical" : ""}>
                  <td className="print-td-mono">{r.term}</td>
                  <td className="print-td-bold">{r.due}</td>
                  <td>
                    {r.desc}
                    {r.critical && <span className="print-flag">Critical</span>}
                    {r.current && <span className="print-flag current">Current</span>}
                  </td>
                  <td>
                    <span className={`print-status ${r.done ? "done" : "pending"}`}>
                      {r.done ? "✓ Done" : "Pending"}
                    </span>
                  </td>
                  <td className="print-td-note">{r.comment || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      {/* Footer block — repeats on each page via running footer styling */}
      <footer className="print-foot">
        <div className="print-foot-left">
          <div className="print-foot-name">Daniel Ulu</div>
          <div className="print-foot-meta">Team Leader · The Ulu Team</div>
          <div className="print-foot-meta">Keller Williams Honolulu · RB-21303</div>
        </div>
        <div className="print-foot-right">
          <div className="print-foot-meta">daniel@uluteam.com</div>
          <div className="print-foot-meta">808-295-8157</div>
        </div>
        <div className="print-foot-disclaimer">
          This summary is generated from The Ulu Team's working transaction file. Dates are calculated from the Acceptance Date using HAR standard contingency periods. The executed Purchase Contract and its addenda are the controlling documents. © 2026 The Ulu Team.
        </div>
      </footer>
    </div>
  );
}

window.TimelinePrint = TimelinePrint;
