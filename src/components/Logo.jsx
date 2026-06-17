import { T } from "../theme/tokens";

export function Logo({ go }) {
  return (
    <div onClick={() => go("home")}
      style={{ fontFamily: T.sans, fontWeight: 800, fontSize: 19, color: T.ink, cursor: "pointer", letterSpacing: -0.3, display: "flex", alignItems: "center", gap: 9 }}>
      <svg width="22" height="22" viewBox="0 0 22 22">
        <path d="M11 3 L3.5 16 L18.5 16 Z" stroke={T.accent} fill="none" strokeWidth="1.6" />
        <circle cx="11" cy="3" r="2.6" fill={T.accent} />
        <circle cx="3.5" cy="16" r="2.6" fill={T.ink} />
        <circle cx="18.5" cy="16" r="2.6" fill={T.ink} />
      </svg>
      Plexus
    </div>
  );
}
