// logos.jsx — Ulu Team + GEM Mortgage logos

// Real Ulu Team logo — uses the official PNG asset
// For dark backgrounds, point variant="white" at assets/ulu-logo-white.png if present;
// fallback inverts the color logo so it stays legible until the white asset is uploaded.
function UluLogo({ height = 54, variant = "color" }) {
  const colorSrc = (typeof window !== "undefined" && window.__ULU_COLOR_LOGO__) || "assets/ulu-logo.png";
  const whiteSrc = (typeof window !== "undefined" && window.__ULU_WHITE_LOGO__) || "assets/ulu-logo-white.png";
  const targetSrc = variant === "white" ? whiteSrc : colorSrc;
  const [src, setSrc] = React.useState(targetSrc);
  // Re-sync if variant changes after mount
  React.useEffect(() => { setSrc(targetSrc); }, [targetSrc]);
  const isWhiteFallback = variant === "white" && src === colorSrc;
  return (
    <img
      src={src}
      alt="The Ulu Team — Real Estate Services with Aloha"
      onError={() => {
        if (variant === "white" && src === whiteSrc && whiteSrc !== colorSrc) {
          setSrc(colorSrc);
        }
      }}
      style={{
        height,
        width: "auto",
        display: "inline-block",
        objectFit: "contain",
        filter: isWhiteFallback ? "brightness(0) invert(1)" : "none",
      }}
    />
  );
}

// Minimalist mark-only version
function UluMark({ size = 40, variant = "color" }) {
  const red = variant === "white" ? "#fff" : "#B32025";
  const ink = variant === "white" ? "#fff" : "#0B0B0B";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="36" r="22" fill={red} />
      <g fill={variant === "white" ? "#B32025" : "#fff"} opacity="0.35">
        <circle cx="24" cy="30" r="1.6" /><circle cx="32" cy="28" r="1.6" /><circle cx="40" cy="30" r="1.6" />
        <circle cx="20" cy="36" r="1.6" /><circle cx="28" cy="36" r="1.6" /><circle cx="36" cy="36" r="1.6" />
        <circle cx="44" cy="36" r="1.6" /><circle cx="24" cy="42" r="1.6" /><circle cx="32" cy="42" r="1.6" />
        <circle cx="40" cy="42" r="1.6" /><circle cx="28" cy="48" r="1.6" /><circle cx="36" cy="48" r="1.6" />
      </g>
      <path d="M32 14 C 26 8, 18 6, 14 10 C 18 14, 22 18, 32 18 C 42 18, 46 14, 50 10 C 46 6, 38 8, 32 14 Z" fill={ink} />
    </svg>
  );
}

// GEM Mortgage logo — blue diamond + wordmark + tagline
function GemLogo({ height = 56, stacked = false }) {
  const blue = "#004FA3";
  const darkBlue = "#003A7A";
  if (stacked) {
    return (
      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <svg width={height} height={height} viewBox="0 0 64 64" fill="none">
          <path d="M12 22 L32 4 L52 22 L32 60 Z" fill={blue} />
          <path d="M12 22 L52 22" stroke="#fff" strokeWidth="1.2" opacity="0.55" />
          <path d="M22 12 L32 22 L22 60" stroke="#fff" strokeWidth="1.2" opacity="0.55" fill="none" />
          <path d="M42 12 L32 22 L42 60" stroke="#fff" strokeWidth="1.2" opacity="0.55" fill="none" />
          <path d="M32 4 L32 22" stroke="#fff" strokeWidth="1.2" opacity="0.55" />
          {/* highlight */}
          <path d="M14 22 L32 6 L50 22" stroke="#fff" strokeWidth="0.8" opacity="0.4" fill="none" />
        </svg>
        <div style={{ textAlign: "center", lineHeight: 1 }}>
          <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 22, color: darkBlue, letterSpacing: "0.5px" }}>
            GEM <span style={{ fontWeight: 400, fontStyle: "italic" }}>Mortgage</span>
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 9.5, color: "#6A7789", letterSpacing: "1px", marginTop: 6, fontStyle: "italic" }}>
            A Division of Golden Empire Mortgage, Inc.
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
      <svg width={height} height={height} viewBox="0 0 64 64" fill="none">
        <path d="M12 22 L32 4 L52 22 L32 60 Z" fill={blue} />
        <path d="M12 22 L52 22" stroke="#fff" strokeWidth="1.2" opacity="0.55" />
        <path d="M22 12 L32 22 L22 60" stroke="#fff" strokeWidth="1.2" opacity="0.55" fill="none" />
        <path d="M42 12 L32 22 L42 60" stroke="#fff" strokeWidth="1.2" opacity="0.55" fill="none" />
        <path d="M32 4 L32 22" stroke="#fff" strokeWidth="1.2" opacity="0.55" />
        <path d="M14 22 L32 6 L50 22" stroke="#fff" strokeWidth="0.8" opacity="0.4" fill="none" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: height * 0.44, color: darkBlue, letterSpacing: "0.4px" }}>
          GEM <span style={{ fontWeight: 400, fontStyle: "italic" }}>Mortgage</span>
        </span>
        <span style={{ fontFamily: "Georgia, serif", fontSize: height * 0.17, color: "#6A7789", letterSpacing: "0.8px", marginTop: 6, fontStyle: "italic" }}>
          A Division of Golden Empire Mortgage, Inc.
        </span>
      </div>
    </div>
  );
}

Object.assign(window, { UluLogo, UluMark, GemLogo });
