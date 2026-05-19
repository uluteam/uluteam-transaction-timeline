// icons.jsx — stroke icons at 18px default

function Icon({ name, size = 18, stroke = 1.75, className = "icon", style }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round", className, style };
  switch (name) {
    case "home": return <svg {...p}><path d="M3 10 L12 3 L21 10 V20 a1 1 0 0 1 -1 1 H4 a1 1 0 0 1 -1 -1 Z" /><path d="M9 21 V13 H15 V21" /></svg>;
    case "receipt": return <svg {...p}><path d="M5 3 h14 v18 l-3-2 -3 2 -2-2 -2 2 -4-2 Z" /><path d="M9 8 h8 M9 12 h8 M9 16 h5" /></svg>;
    case "badge": return <svg {...p}><rect x="3" y="6" width="18" height="14" rx="2" /><circle cx="12" cy="13" r="3" /><path d="M9 3 h6 v3 h-6 Z" /></svg>;
    case "heart": return <svg {...p}><path d="M20.84 4.61 a5.5 5.5 0 0 0 -7.78 0 L12 5.67 l-1.06-1.06 a5.5 5.5 0 0 0 -7.78 7.78 l1.06 1.06 L12 21.23 l7.78-7.78 1.06-1.06 a5.5 5.5 0 0 0 0-7.78 Z" /></svg>;
    case "folder": return <svg {...p}><path d="M3 7 a1 1 0 0 1 1-1 h5 l2 2 h9 a1 1 0 0 1 1 1 V19 a1 1 0 0 1 -1 1 H4 a1 1 0 0 1 -1-1 Z" /></svg>;
    case "message": return <svg {...p}><path d="M21 15 a2 2 0 0 1 -2 2 H7 l-4 4 V5 a2 2 0 0 1 2-2 h14 a2 2 0 0 1 2 2 Z" /></svg>;
    case "calendar": return <svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3 V7 M16 3 V7 M3 11 h18" /></svg>;
    case "settings": return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15 a1.65 1.65 0 0 0 .33 1.82 l.06.06 a2 2 0 1 1 -2.83 2.83 l-.06-.06 a1.65 1.65 0 0 0 -1.82-.33 1.65 1.65 0 0 0 -1 1.51 V21 a2 2 0 1 1 -4 0 v-.09 a1.65 1.65 0 0 0 -1.08-1.51 1.65 1.65 0 0 0 -1.82 .33 l-.06.06 a2 2 0 1 1 -2.83-2.83 l.06-.06 A1.65 1.65 0 0 0 4.6 15 1.65 1.65 0 0 0 3 14 H3 a2 2 0 1 1 0-4 h.09 a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0 -.33-1.82 l-.06-.06 a2 2 0 1 1 2.83-2.83 l.06.06 a1.65 1.65 0 0 0 1.82 .33 H9 a1.65 1.65 0 0 0 1-1.51 V3 a2 2 0 1 1 4 0 v.09 a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33 l.06-.06 a2 2 0 1 1 2.83 2.83 l-.06.06 a1.65 1.65 0 0 0 -.33 1.82 V9 a1.65 1.65 0 0 0 1.51 1 H21 a2 2 0 1 1 0 4 h-.09 a1.65 1.65 0 0 0 -1.51 1 Z" /></svg>;
    case "phone": return <svg {...p}><path d="M22 16.92 v3 a2 2 0 0 1 -2.18 2 19.79 19.79 0 0 1 -8.63 -3.07 19.5 19.5 0 0 1 -6 -6 19.79 19.79 0 0 1 -3.07 -8.67 A2 2 0 0 1 4.11 2 h3 a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1 -.45 2.11 L8.09 9.91 a16 16 0 0 0 6 6 l1.27-1.27 a2 2 0 0 1 2.11 -.45 12.84 12.84 0 0 0 2.81 .7 A2 2 0 0 1 22 16.92 Z" /></svg>;
    case "send": return <svg {...p}><path d="M22 2 L11 13 M22 2 L15 22 L11 13 L2 9 Z" /></svg>;
    case "check": return <svg {...p}><path d="M20 6 L9 17 L4 12" /></svg>;
    case "upload": return <svg {...p}><path d="M21 15 V19 a2 2 0 0 1 -2 2 H5 a2 2 0 0 1 -2-2 V15 M17 8 L12 3 L7 8 M12 3 V15" /></svg>;
    case "download": return <svg {...p}><path d="M21 15 V19 a2 2 0 0 1 -2 2 H5 a2 2 0 0 1 -2-2 V15 M7 10 L12 15 L17 10 M12 15 V3" /></svg>;
    case "plus": return <svg {...p}><path d="M12 5 V19 M5 12 H19" /></svg>;
    case "edit": return <svg {...p}><path d="M11 4 H4 a2 2 0 0 0 -2 2 V20 a2 2 0 0 0 2 2 H18 a2 2 0 0 0 2-2 V13 M18.5 2.5 a2.12 2.12 0 0 1 3 3 L12 15 L8 16 L9 12 Z" /></svg>;
    case "trash": return <svg {...p}><path d="M3 6 H21 M8 6 V4 a2 2 0 0 1 2-2 H14 a2 2 0 0 1 2 2 V6 M19 6 L18 20 a2 2 0 0 1 -2 2 H8 a2 2 0 0 1 -2-2 L5 6" /></svg>;
    case "copy": return <svg {...p}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15 H4 a2 2 0 0 1 -2-2 V4 a2 2 0 0 1 2-2 H13 a2 2 0 0 1 2 2 V5" /></svg>;
    case "search": return <svg {...p}><circle cx="11" cy="11" r="8" /><path d="M21 21 L16.65 16.65" /></svg>;
    case "print": return <svg {...p}><path d="M6 9 V2 H18 V9 M6 18 H4 a2 2 0 0 1 -2-2 V11 a2 2 0 0 1 2-2 H20 a2 2 0 0 1 2 2 V16 a2 2 0 0 1 -2 2 H18 M6 14 H18 V22 H6 Z" /></svg>;
    case "arrow-right": return <svg {...p}><path d="M5 12 H19 M12 5 L19 12 L12 19" /></svg>;
    case "close": return <svg {...p}><path d="M18 6 L6 18 M6 6 L18 18" /></svg>;
    case "shield": return <svg {...p}><path d="M12 2 L4 6 v6 c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10 V6 Z" /></svg>;
    case "diamond": return <svg {...p}><path d="M6 3 H18 L22 9 L12 22 L2 9 Z M2 9 H22 M7 9 L12 22 M17 9 L12 22 M12 3 L8 9 L12 22 M12 3 L16 9" /></svg>;
    case "dollar": return <svg {...p}><path d="M12 1 V23 M17 5 H9.5 a3.5 3.5 0 0 0 0 7 H14.5 a3.5 3.5 0 0 1 0 7 H6" /></svg>;
    case "clipboard": return <svg {...p}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4 h2 a2 2 0 0 1 2 2 V20 a2 2 0 0 1 -2 2 H6 a2 2 0 0 1 -2-2 V6 a2 2 0 0 1 2-2 H8" /></svg>;
    case "chevron-down": return <svg {...p}><path d="M6 9 L12 15 L18 9" /></svg>;
    case "chevron-right": return <svg {...p}><path d="M9 6 L15 12 L9 18" /></svg>;
    case "lock": return <svg {...p}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11 V7 a5 5 0 0 1 10 0 V11" /></svg>;
    case "mail": return <svg {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7 L12 14 L2 7" /></svg>;
    case "external": return <svg {...p}><path d="M18 13 V19 a2 2 0 0 1 -2 2 H5 a2 2 0 0 1 -2-2 V8 a2 2 0 0 1 2-2 H11 M15 3 H21 V9 M10 14 L21 3" /></svg>;
    case "bell": return <svg {...p}><path d="M18 8 a6 6 0 0 0 -12 0 c0 7-3 9-3 9 h18 s-3-2-3-9 M13.73 21 a2 2 0 0 1 -3.46 0" /></svg>;
    default: return null;
  }
}

window.Icon = Icon;
