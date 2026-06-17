import { useMemo, useRef, useState } from "react";
import { T } from "../theme/tokens";
import { rampColor } from "../lib/color";
import { shortestPath } from "../lib/graph";
import { GENERATORS, ring } from "../lib/generators";
import { usePersistentGraph } from "../hooks/usePersistentGraph";
import { useCentrality } from "../hooks/useCentrality";
import { useForceSimulation } from "../hooks/useForceSimulation";

/* ================== THE LAB ================== */
export function GraphLab({ height = 560 }) {
  const [graph, setGraph] = usePersistentGraph();
  const [metric, setMetric] = useState("bet");
  const [mode, setMode] = useState("path");
  const [selected, setSelected] = useState([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [hovered, setHovered] = useState(null);

  const svgRef = useRef(null);
  const { simRef, dragRef, reheat } = useForceSimulation(graph);

  const stats = useCentrality(graph);
  const metricMap = { deg: stats.deg, clo: stats.clo, bet: stats.bet, eig: stats.eig };
  const scores = metricMap[metric];
  const maxScore = Math.max(0.0001, ...Object.values(scores));
  const topId = graph.nodes.reduce((m, n) => (scores[n.id] > (scores[m?.id] ?? -1) ? n : m), null)?.id;

  const path = useMemo(
    () => (selected.length === 2 ? shortestPath(stats.adj, selected[0], selected[1]) : null),
    [selected, stats.adj]
  );
  const pathEdges = useMemo(() => {
    const s = new Set();
    if (path) for (let i = 0; i < path.length - 1; i++) s.add([path[i], path[i + 1]].sort().join("→"));
    return s;
  }, [path]);

  const loadPreset = (key) => { setGraph(GENERATORS[key]()); setSelected([]); reheat(); };

  const svgPoint = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 840, y: ((e.clientY - r.top) / r.height) * 560 };
  };

  const onNodeClick = (id) => {
    if (mode === "build") {
      if (selected.length === 1 && selected[0] !== id) {
        setGraph((g) => {
          const dup = g.edges.some((e) => (e.a === selected[0] && e.b === id) || (e.b === selected[0] && e.a === id));
          return dup ? g : { ...g, edges: [...g.edges, { a: selected[0], b: id }] };
        });
        setSelected([]); reheat();
      } else setSelected([id]);
    } else {
      setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 2 ? [id] : [...s, id]));
    }
  };

  const deleteNode = (id) => {
    setGraph((g) => ({
      nodes: g.nodes.filter((n) => n.id !== id),
      edges: g.edges.filter((e) => e.a !== id && e.b !== id),
    }));
    setSelected([]); reheat();
  };

  const onCanvasClick = (e) => {
    if (mode !== "build" || e.target !== e.currentTarget) return;
    const { x, y } = svgPoint(e);
    setGraph((g) => {
      let i = g.nodes.length + 1, id = `N${i}`;
      while (g.nodes.some((n) => n.id === id)) id = `N${++i}`;
      return { ...g, nodes: [...g.nodes, { id, x, y, vx: 0, vy: 0 }] };
    });
    reheat();
  };

  const startDrag = (id) => (e) => {
    e.stopPropagation();
    dragRef.current = id;
    const move = (ev) => {
      const { x, y } = svgPoint(ev);
      setGraph((g) => ({ ...g, nodes: g.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)) }));
      simRef.current.alpha = Math.max(simRef.current.alpha, 0.3);
    };
    const up = () => {
      dragRef.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const doImport = () => {
    const set = new Set(), edges = [];
    importText.split(/\n+/).forEach((line) => {
      const parts = line.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 2) { set.add(parts[0]); set.add(parts[1]); edges.push({ a: parts[0], b: parts[1] }); }
      else if (parts.length === 1) set.add(parts[0]);
    });
    if (!set.size) return;
    setGraph({ nodes: ring([...set]), edges });
    setSelected([]); setImportOpen(false); setImportText(""); reheat();
  };

  const exportCSV = () => {
    let csv = "node,degree,closeness,betweenness,eigenvector\n";
    graph.nodes.forEach((n) => {
      csv += `${n.id},${stats.deg[n.id].toFixed(4)},${stats.clo[n.id].toFixed(4)},${stats.bet[n.id].toFixed(4)},${stats.eig[n.id].toFixed(4)}\n`;
    });
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "plexus-centrality.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const sorted = [...graph.nodes].sort((a, b) => scores[b.id] - scores[a.id]);
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const labels = { deg: "Degree", clo: "Closeness", bet: "Betweenness", eig: "Eigenvector" };
  const critical = [...graph.nodes].sort((a, b) => stats.bet[b.id] - stats.bet[a.id]).slice(0, 3);

  const chip = (active) => ({
    background: active ? T.ink : T.surface,
    color: active ? "#fff" : T.muted,
    border: `1px solid ${active ? T.ink : T.border}`,
    borderRadius: 999, padding: "7px 14px", fontFamily: T.mono, fontSize: 12,
    cursor: "pointer", fontWeight: active ? 600 : 400,
  });

  return (
    <div className="card" style={{ overflow: "hidden", boxShadow: "0 10px 40px rgba(21,23,28,.06)" }}>
      {/* toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 14, borderBottom: `1px solid ${T.border}`, alignItems: "center", background: T.surface }}>
        {Object.entries(labels).map(([k, l]) => (
          <button key={k} className="btn" style={chip(metric === k)} onClick={() => setMetric(k)}>{l}</button>
        ))}
        <div style={{ width: 1, height: 22, background: T.border, margin: "0 4px" }} />
        <button className="btn" style={chip(mode === "path")} onClick={() => { setMode("path"); setSelected([]); }}>⌖ Trace</button>
        <button className="btn" style={chip(mode === "build")} onClick={() => { setMode("build"); setSelected([]); }}>+ Build</button>
        <div style={{ flex: 1 }} />
        <select
          onChange={(e) => { if (e.target.value) loadPreset(e.target.value); e.target.value = ""; }}
          defaultValue=""
          style={{ ...chip(false), appearance: "none", paddingRight: 22 }}>
          <option value="" disabled>Presets ▾</option>
          <option value="social">Social circle</option>
          <option value="bridge">Two communities + broker</option>
          <option value="star">Star (hub & spokes)</option>
          <option value="random">Random network</option>
        </select>
        <button className="btn" style={chip(false)} onClick={() => setImportOpen(true)}>Import</button>
        <button className="btn" style={chip(false)} onClick={exportCSV}>Export CSV</button>
        <button className="btn" style={chip(false)} onClick={reheat}>↻ Layout</button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {/* canvas */}
        <div style={{ flex: "2 1 440px", minWidth: 320, position: "relative" }}>
          <svg ref={svgRef} viewBox="0 0 840 560"
            style={{ width: "100%", height, display: "block", background: T.canvas, cursor: mode === "build" ? "crosshair" : "default", touchAction: "none" }}
            onClick={onCanvasClick}>
            <defs>
              <pattern id="grid" width="34" height="34" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="#DEDFD9" />
              </pattern>
            </defs>
            <rect width="840" height="560" fill="url(#grid)" pointerEvents="none" />

            {graph.edges.map((e, i) => {
              const a = byId.get(e.a), b = byId.get(e.b);
              if (!a || !b) return null;
              const onPath = pathEdges.has([e.a, e.b].sort().join("→"));
              const touchesHover = hovered && (e.a === hovered || e.b === hovered);
              return (
                <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  className={onPath ? "path-edge" : undefined}
                  stroke={onPath ? T.signal : touchesHover ? T.accent : "#C9CBD6"}
                  strokeWidth={onPath ? 3 : touchesHover ? 2 : 1.4} />
              );
            })}

            {graph.nodes.map((n) => {
              const s = scores[n.id] / maxScore;
              const r = 7 + s * 15;
              const isSel = selected.includes(n.id);
              const onPath = path?.includes(n.id);
              const isTop = n.id === topId;
              return (
                <g key={n.id}
                  onPointerDown={startDrag(n.id)}
                  onClick={(e) => { e.stopPropagation(); onNodeClick(n.id); }}
                  onDoubleClick={(e) => { e.stopPropagation(); if (mode === "build") deleteNode(n.id); }}
                  onMouseEnter={() => setHovered(n.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: "pointer" }}>
                  {isTop && (
                    <circle cx={n.x} cy={n.y} r={r + 11} fill={T.accent} opacity="0.25"
                      style={{ filter: "blur(7px)", animation: "breathe 2.6s ease-in-out infinite" }} />
                  )}
                  <circle cx={n.x} cy={n.y} r={r} fill={rampColor(s)}
                    stroke={onPath ? T.signal : isSel ? T.ink : "#FFFFFF"}
                    strokeWidth={isSel || onPath ? 2.5 : 1.5} />
                  <text x={n.x} y={n.y - r - 7} textAnchor="middle"
                    fill={hovered === n.id ? T.ink : T.muted} fontSize="11" fontFamily={T.mono} fontWeight={hovered === n.id ? 600 : 400}>
                    {n.id}{hovered === n.id ? ` · ${scores[n.id].toFixed(3)}` : ""}
                  </text>
                </g>
              );
            })}
          </svg>
          <div style={{ position: "absolute", bottom: 10, left: 14, fontFamily: T.mono, fontSize: 11, color: T.muted }}>
            {mode === "build"
              ? "click space → node · node + node → edge · double-click → delete"
              : selected.length === 2 && path
                ? `path: ${path.join(" → ")} · ${path.length - 1} hops`
                : selected.length === 2
                  ? "no path between these nodes"
                  : "click two nodes to trace the shortest route · drag anything"}
          </div>
        </div>

        {/* side panel */}
        <div style={{ flex: "1 1 250px", minWidth: 250, borderLeft: `1px solid ${T.border}`, maxHeight: height, overflowY: "auto", background: T.surface }}>
          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 2, color: T.muted, marginBottom: 8 }}>CRITICAL BRIDGES</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {critical.map((n, i) => (
                <button key={n.id} className="btn" onClick={() => onNodeClick(n.id)}
                  style={{
                    background: i === 0 ? T.accent : T.accentSoft,
                    color: i === 0 ? "#fff" : T.accent, fontWeight: 600,
                    border: "none", borderRadius: 999, padding: "5px 12px", fontFamily: T.mono, fontSize: 12,
                  }}>
                  {n.id}
                </button>
              ))}
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.mono, fontSize: 12 }}>
            <thead>
              <tr style={{ position: "sticky", top: 0, background: T.bg, zIndex: 1 }}>
                {["#", "Node", labels[metric]].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "9px 12px", color: T.muted, fontWeight: 500, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((n, i) => (
                <tr key={n.id} className="row-hover" onClick={() => onNodeClick(n.id)}
                  style={{ cursor: "pointer", background: selected.includes(n.id) ? T.accentSoft : "transparent" }}>
                  <td style={{ padding: "7px 12px", color: T.muted, borderBottom: `1px solid ${T.border}` }}>{i + 1}</td>
                  <td style={{ padding: "7px 12px", color: T.ink, borderBottom: `1px solid ${T.border}` }}>{n.id}</td>
                  <td style={{ padding: "7px 12px", color: rampColor(scores[n.id] / maxScore), fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>
                    {scores[n.id].toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* telemetry */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 22, padding: "11px 16px", borderTop: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 12, color: T.muted, background: T.bg }}>
        <span>nodes <b style={{ color: T.ink }}>{graph.nodes.length}</b></span>
        <span>edges <b style={{ color: T.ink }}>{graph.edges.length}</b></span>
        <span>density <b style={{ color: T.ink }}>{stats.density.toFixed(3)}</b></span>
        <span>diameter <b style={{ color: T.ink }}>{stats.diameter}</b></span>
        <span>compute <b style={{ color: T.accent }}>{stats.ms.toFixed(1)} ms</b></span>
      </div>

      {/* import modal */}
      {importOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(21,23,28,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
          onClick={() => setImportOpen(false)}>
          <div className="card fade-up" style={{ padding: 24, width: "min(480px, 92vw)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 17, color: T.ink }}>Import edge list</div>
            <div style={{ fontFamily: T.mono, fontSize: 12, color: T.muted, margin: "6px 0 12px" }}>
              One edge per line — <span style={{ color: T.accent, fontWeight: 600 }}>source,target</span>
            </div>
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)}
              placeholder={"alice,bob\nbob,carol\ncarol,dave"}
              style={{ width: "100%", height: 160, background: T.bg, color: T.ink, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, fontFamily: T.mono, fontSize: 12, resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" style={{ borderRadius: 999, padding: "8px 16px", fontFamily: T.mono, fontSize: 12 }}
                onClick={() => setImportOpen(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ borderRadius: 999, padding: "8px 18px", fontFamily: T.mono, fontSize: 12, fontWeight: 600 }}
                onClick={doImport}>Load graph</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
