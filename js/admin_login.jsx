// admin_login.jsx — sign in with email + password

function AdminLogin({ go }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  // If already signed in, bounce straight to dashboard
  React.useEffect(() => {
    if (isSignedIn()) go("/admin/dashboard");
  }, []);

  const handleSignIn = (e) => {
    if (e) e.preventDefault();
    const result = signIn(email, password, remember);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    go("/admin/dashboard");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#EDEBE7", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <form onSubmit={handleSignIn} style={{ width: 440, maxWidth: "100%", background: "#fff", borderRadius: 12, boxShadow: "0 24px 48px -24px rgba(11,11,11,0.22)", overflow: "hidden", border: "1px solid var(--line)" }}>
        <div style={{ background: "var(--red)", padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <UluLogo height={42} variant="white" />
        </div>
        <div style={{ padding: "36px 40px 36px", borderTop: "3px solid var(--red-ink)" }}>
          <div className="eyebrow" style={{ color: "var(--red)", marginBottom: 8, textAlign: "center" }}>Internal Access Only</div>
          <h1 className="h1" style={{ margin: 0, textAlign: "center", fontSize: 30 }}>Admin Login</h1>
          <div style={{ height: 26 }} />
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(""); }}
            placeholder="you@uluteam.com"
            style={{ marginBottom: 14 }}
          />
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }}
            placeholder="••••••••••••"
            style={{ marginBottom: 8 }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-3)", cursor: "pointer" }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: "var(--red)" }} />
              Remember on this device
            </label>
            <a href="#" onClick={e => { e.preventDefault(); alert("Contact info@uluteam.com to reset your password."); }} style={{ fontSize: 12, color: "var(--ink-3)", textDecoration: "underline" }}>Forgot password?</a>
          </div>
          {error && (
            <div style={{ background: "var(--red-wash)", color: "var(--red)", border: "1px solid #F1D8D9", borderRadius: 6, padding: "8px 12px", fontSize: 12.5, marginBottom: 12 }}>
              {error}
            </div>
          )}
          <button type="submit" className="btn btn-red" style={{ width: "100%" }}>Sign In</button>

          {/* Demo-account quick fill — remove this block before production launch */}
          <details style={{ marginTop: 18, fontSize: 11.5 }}>
            <summary style={{ cursor: "pointer", color: "var(--ink-4)", padding: "8px 0" }}>Demo accounts (remove before launch)</summary>
            <div style={{ padding: "8px 12px", background: "#FAFAF6", border: "1px dashed var(--line)", borderRadius: 8 }}>
              {USERS.map(u => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => {
                    setEmail(u.email);
                    setPassword(PASSWORDS[u.email]);
                    setError("");
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "6px 4px", textAlign: "left", background: "transparent", border: "none", borderRadius: 4, cursor: "pointer" }}
                >
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: u.avatar, color: "#fff", fontSize: 9.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{u.initials}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, color: "var(--ink-2)" }}>{u.name}</span>
                    <span style={{ color: "var(--ink-4)" }}> · {u.role}</span>
                  </span>
                </button>
              ))}
            </div>
          </details>

          <div style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "var(--ink-4)" }}>Keller Williams Honolulu · RB-21303</div>
        </div>
      </form>
    </div>
  );
}

window.AdminLogin = AdminLogin;
