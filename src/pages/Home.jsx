import { T } from "../theme/tokens";
import { Reveal } from "../components/Reveal";
import { GraphLab } from "../components/GraphLab";
import { METRICS_INFO } from "../data/content";

const FEATURES = [
  ["The product is the proof", "No demo video, no screenshots. The full engine runs on this page — every number you see was just computed in your tab."],
  ["Built for real graphs", "Org charts, microservice meshes, flight routes, transaction webs. Paste a CSV or sketch it node-by-node in build mode."],
  ["Private by architecture", "There is no server to trust. Parsing, Brandes' algorithm, layout physics — all client-side. Proprietary data stays proprietary."],
];

export function Home({ go }) {
  return (
    <>
      {/* hero */}
      <header style={{ maxWidth: 1140, margin: "0 auto", padding: "64px 24px 28px" }}>
        <h1 className="fade-up" style={{ fontSize: "clamp(36px, 6vw, 64px)", lineHeight: 1.05, margin: 0, fontWeight: 800, maxWidth: 780, letterSpacing: -1.5 }}>
          Every network has a center of gravity.{" "}
          <span style={{ color: T.accent }}>Find yours.</span>
        </h1>
        <p className="fade-up" style={{ color: T.muted, fontSize: 18, maxWidth: 620, lineHeight: 1.65, marginTop: 20, animationDelay: ".12s" }}>
          Plexus turns any edge list — a team, a server mesh, a money trail — into a living map,
          then ranks every node by four centrality metrics. Computed in milliseconds,
          entirely in your browser. Your data never leaves the tab.
        </p>
        <div className="fade-up" style={{ display: "flex", gap: 12, marginTop: 26, flexWrap: "wrap", animationDelay: ".22s" }}>
          <button className="btn btn-primary" onClick={() => go("app")}
            style={{ borderRadius: 999, padding: "13px 28px", fontWeight: 700, fontSize: 15 }}>
            Open the lab — it's free
          </button>
          <button className="btn btn-ghost" onClick={() => go("pricing")}
            style={{ borderRadius: 999, padding: "13px 24px", fontWeight: 500, fontSize: 15 }}>
            See pricing
          </button>
        </div>

        <div className="fade-up" style={{ fontFamily: T.mono, fontSize: 12, color: T.muted, margin: "40px 0 14px", animationDelay: ".3s" }}>
          ▼ live instance — drag a node, click two of them, trace the path
        </div>
        <div className="fade-up" style={{ animationDelay: ".38s" }}>
          <GraphLab height={480} />
        </div>
      </header>

      {/* feature trio */}
      <section style={{ maxWidth: 1140, margin: "0 auto", padding: "64px 24px 8px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          {FEATURES.map(([h, p], i) => (
            <Reveal key={h} delay={i * 110}>
              <div className="card card-hover" style={{ padding: 26, height: "100%" }}>
                <div style={{ width: 34, height: 4, background: T.accent, borderRadius: 2, marginBottom: 16 }} />
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{h}</div>
                <div style={{ color: T.muted, fontSize: 14.5, lineHeight: 1.65 }}>{p}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* metrics explained */}
      <section style={{ maxWidth: 1140, margin: "0 auto", padding: "72px 24px 8px" }}>
        <Reveal>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", margin: "0 0 28px", fontWeight: 800, letterSpacing: -0.5 }}>
            Four ways a node can be <span style={{ color: T.accent }}>important.</span>
          </h2>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 18 }}>
          {METRICS_INFO.map(([name, q, desc], i) => (
            <Reveal key={name} delay={i * 90}>
              <div className="card card-hover" style={{ padding: 24, height: "100%" }}>
                <div style={{ fontFamily: T.mono, fontSize: 12, color: T.accent, letterSpacing: 1, marginBottom: 10 }}>{name.toUpperCase()}</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, lineHeight: 1.35 }}>{q}</div>
                <div style={{ color: T.muted, fontSize: 14, lineHeight: 1.6 }}>{desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* final CTA */}
      <section style={{ maxWidth: 1140, margin: "0 auto", padding: "72px 24px 80px" }}>
        <Reveal>
          <div className="card" style={{ padding: "56px 32px", textAlign: "center", background: T.ink }}>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800, margin: 0, color: "#fff", letterSpacing: -0.5 }}>
              Your network already has answers.<br />
              <span style={{ color: "#8FA0FF" }}>Plexus makes them visible.</span>
            </h2>
            <button className="btn btn-primary" onClick={() => go("app")}
              style={{ borderRadius: 999, padding: "14px 32px", fontWeight: 700, fontSize: 16, marginTop: 28 }}>
              Launch the lab →
            </button>
          </div>
        </Reveal>
      </section>

      <footer style={{ borderTop: `1px solid ${T.border}`, padding: "26px 24px", textAlign: "center", fontFamily: T.mono, fontSize: 12, color: T.muted }}>
        Plexus · centrality computed where your data lives
      </footer>
    </>
  );
}
