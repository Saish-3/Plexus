import { useState } from "react";
import { T } from "../theme/tokens";
import { Reveal } from "../components/Reveal";
import { PLANS, FAQS } from "../data/content";

export function Pricing({ go }) {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <>
      <header style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 12px", textAlign: "center" }}>
        <h1 className="fade-up" style={{ fontSize: "clamp(32px, 5vw, 50px)", fontWeight: 800, margin: 0, letterSpacing: -1 }}>
          Simple pricing, <span style={{ color: T.accent }}>no surprises.</span>
        </h1>
        <p className="fade-up" style={{ color: T.muted, fontSize: 17, lineHeight: 1.65, marginTop: 16, animationDelay: ".1s" }}>
          Explorer is free forever and needs no account. Paid plans exist for one reason:
          bigger graphs and team workflows.
        </p>
      </header>

      <section style={{ maxWidth: 1140, margin: "0 auto", padding: "28px 24px 8px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 18, alignItems: "stretch" }}>
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 110}>
              <div className="card card-hover" style={{
                padding: 30, height: "100%", position: "relative",
                border: p.featured ? `2px solid ${T.accent}` : undefined,
                boxShadow: p.featured ? "0 16px 48px rgba(39,66,236,0.14)" : undefined,
              }}>
                {p.featured && (
                  <div style={{ position: "absolute", top: -13, left: 26, background: T.accent, color: "#fff", fontFamily: T.mono, fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "4px 12px", letterSpacing: 1 }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ fontFamily: T.mono, fontSize: 13, color: p.featured ? T.accent : T.muted, letterSpacing: 2 }}>{p.name.toUpperCase()}</div>
                <div style={{ fontSize: 42, fontWeight: 800, marginTop: 10 }}>
                  {p.price} <span style={{ fontSize: 14, color: T.muted, fontWeight: 400 }}>{p.per}</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 26px", color: T.muted, fontSize: 14.5, lineHeight: 2.15 }}>
                  {p.points.map((pt) => (
                    <li key={pt}><span style={{ color: T.accent, fontWeight: 700 }}>✓</span>&nbsp; {pt}</li>
                  ))}
                </ul>
                <button className={`btn ${p.featured ? "btn-primary" : "btn-ghost"}`} onClick={() => go("app")}
                  style={{ width: "100%", padding: "12px 0", borderRadius: 999, fontWeight: 600, fontSize: 14 }}>
                  {p.cta}
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* comparison strip */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 8px" }}>
        <Reveal>
          <div className="card" style={{ padding: "20px 24px", display: "flex", gap: 28, flexWrap: "wrap", justifyContent: "center", fontFamily: T.mono, fontSize: 13, color: T.muted }}>
            <span><b style={{ color: T.ink }}>0</b> servers touched</span>
            <span><b style={{ color: T.ink }}>4</b> centrality metrics</span>
            <span><b style={{ color: T.ink }}>1</b> click to cancel</span>
            <span><b style={{ color: T.accent }}>∞</b> graphs on Analyst</span>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        <Reveal>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>Frequently asked</h2>
        </Reveal>
        {FAQS.map(([q, a], i) => (
          <Reveal key={q} delay={i * 70}>
            <div className="card" style={{ marginBottom: 10, overflow: "hidden" }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: "100%", textAlign: "left", background: "none", border: "none", color: T.ink, padding: "16px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {q}
                <span style={{ color: T.accent, fontSize: 18, fontWeight: 700, transform: openFaq === i ? "rotate(45deg)" : "none", transition: "transform .3s", display: "inline-block" }}>+</span>
              </button>
              <div style={{ maxHeight: openFaq === i ? 200 : 0, overflow: "hidden", transition: "max-height .35s cubic-bezier(.2,.7,.2,1)" }}>
                <div style={{ padding: "0 20px 18px", color: T.muted, fontSize: 14, lineHeight: 1.7 }}>{a}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </section>

      <footer style={{ borderTop: `1px solid ${T.border}`, padding: "26px 24px", textAlign: "center", fontFamily: T.mono, fontSize: 12, color: T.muted }}>
        Plexus · centrality computed where your data lives
      </footer>
    </>
  );
}
