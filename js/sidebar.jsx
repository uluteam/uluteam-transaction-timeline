// sidebar.jsx — TM/admin portal left nav (black)

function Sidebar({ currentPath, onNavigate }) {
  const user = getCurrentUser();
  const items = [
    { path: "/admin/dashboard", label: "Timelines", icon: "receipt" },
    { path: "/admin/timeline", label: "Timeline Editor", icon: "edit" },
  ];
  const handleSignOut = () => {
    if (!window.confirm("Sign out?")) return;
    signOut();
    onNavigate("/admin/login");
  };
  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <UluLogo height={56} variant="white" />
        <div style={{ marginTop: 14, fontSize: 10.5, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#8A8580" }}>TM Portal</div>
      </div>
      <nav className="sidebar-nav">
        <div style={{ padding: "0 14px 8px", fontSize: 10.5, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#6B6660" }}>
          Workspace
        </div>
        {items.map(it => {
          const active = currentPath.startsWith(it.path);
          return (
            <div key={it.path} className={cx("sidebar-item", active && "active")} onClick={() => onNavigate(it.path)}>
              <Icon name={it.icon} size={17} />
              <span style={{ flex: 1 }}>{it.label}</span>
            </div>
          );
        })}
      </nav>
      <div className="sidebar-foot">
        <div className="sidebar-user">
          <div className="sidebar-avatar" style={{ background: user ? user.avatar : "linear-gradient(135deg,#B32025,#6B1316)" }}>{user ? user.initials : "?"}</div>
          <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{user ? user.name : "Not signed in"}</div>
            <div style={{ fontSize: 11, color: "#8A8580" }}>{user ? user.role : ""}</div>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            style={{
              width: 28, height: 28, borderRadius: 6,
              color: "#A8A4A0", background: "transparent", border: "1px solid #2A2624",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "var(--red)"; e.currentTarget.style.borderColor = "var(--red)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#A8A4A0"; e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#2A2624"; }}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
