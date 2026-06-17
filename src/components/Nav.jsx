import { T } from "../theme/tokens";
import { Logo } from "./Logo";

export function Nav({ page, go }) {
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(247,247,244,0.85)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "14px 24px", maxWidth: 1140, margin: "0 auto" }}>
        <Logo go={go} />
        <div style={{ flex: 1 }} />
        <button className={`navlink ${page === "home" ? "active" : ""}`} onClick={() => go("home")}>Product</button>
        <button className={`navlink ${page === "pricing" ? "active" : ""}`} onClick={() => go("pricing")}>Pricing</button>
        <button className="btn btn-primary" onClick={() => go(page === "app" ? "home" : "app")}
          style={{ borderRadius: 999, padding: "9px 20px", fontFamily: T.sans, fontWeight: 600, fontSize: 14 }}>
          {page === "app" ? "← Back to site" : "Launch the lab"}
        </button>
      </div>
    </nav>
  );
}
