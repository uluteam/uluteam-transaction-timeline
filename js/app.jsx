// app.jsx — TM/admin portal entry

function App() {
  const [path, go, query] = useRoute();
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    window.__forceRerender = () => forceUpdate(n => n + 1);
    return () => { delete window.__forceRerender; };
  }, []);

  // Route gate — if not signed in and trying to reach an admin route, bounce to login.
  const isAuthRoute = path === "/" || path === "/login" || path === "/admin/login";
  useEffect(() => {
    if (!isAuthRoute && !isSignedIn()) go("/admin/login");
  }, [path]);

  const useSidebar =
    path === "/admin/dashboard" ||
    path === "/admin/timeline";

  let screen;
  if (isAuthRoute) {
    screen = <AdminLogin go={go} />;
  } else if (!isSignedIn()) {
    // Brief blank while the redirect effect fires
    screen = <div style={{ minHeight: "100vh", background: "#EDEBE7" }} />;
  } else if (path === "/admin/dashboard") {
    screen = <AdminDashboard go={go} />;
  } else if (path === "/admin/timeline") {
    screen = <TimelineEditor
      go={go}
      txId={query.id || null}
      side={query.side === "seller" ? "seller" : "buyer"}
    />;
  } else {
    screen = <AdminDashboard go={go} />;
  }

  return (
    <div className="app" data-screen-label={screenLabel(path)}>
      {useSidebar && <Sidebar currentPath={path} onNavigate={go} />}
      <div className="shell-content">{screen}</div>
    </div>
  );
}

function screenLabel(path) {
  const map = {
    "/admin/login": "01 Sign In",
    "/admin/dashboard": "02 Timelines",
    "/admin/timeline": "03 Timeline Editor"
  };
  return map[path] || "01 Sign In";
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
