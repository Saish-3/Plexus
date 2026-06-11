import { useState, useEffect, useRef, useMemo } from "react";

/* ================== PLEXUS — see what holds your network together ==================
   Single-file product. Pages: Home · Pricing · Lab.
   From-scratch algorithms: BFS, Brandes betweenness, closeness, eigenvector,
   force-directed layout. Zero dependencies beyond React. No gradients.
==================================================================================== */

/* ---------------- design tokens ---------------- */
const T = {
  bg: "#F7F7F4",
  surface: "#FFFFFF",
  canvas: "#FCFCFA",
  border: "#E5E5DF",
  ink: "#15171C",
  muted: "#6B7080",
  accent: "#2742EC",      // cobalt — the one brand color
  accentSoft: "#EDF0FE",
  signal: "#E8590C",      // orange — reserved for path tracing only
  rampLo: [200, 205, 222],
  rampHi: [39, 66, 236],
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const STYLES = `
  * { box-sizing: border-box; }
  body { margin: 0; background: ${T.bg}; }
  @keyframes fadeUp { from { opacity:0; transform: translateY(22px); } to { opacity:1; transform:none; } }
  @keyframes dashFlow { to { stroke-dashoffset: -24; } }
  @keyframes breathe { 0%,100% { opacity:.25; } 50% { opacity:.6; } }
  .fade-up { animation: fadeUp .7s cubic-bezier(.2,.7,.2,1) both; }
  .reveal { opacity: 0; transform: translateY(26px); transition: opacity .7s ease, transform .7s cubic-bezier(.2,.7,.2,1); }
  .reveal.in { opacity: 1; transform: none; }
  .card { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 14px; }
  .card-hover { transition: transform .3s cubic-bezier(.2,.7,.2,1), box-shadow .3s, border-color .3s; }
  .card-hover:hover { transform: translateY(-4px); box-shadow: 0 14px 36px rgba(21,23,28,.08); border-color: #D6D6CE; }
  .btn { transition: transform .18s, box-shadow .2s, background .2s, color .2s, border-color .2s; cursor: pointer; }
  .btn:hover { transform: translateY(-1px); }
  .btn:active { transform: translateY(0); }
  .btn:focus-visible { outline: 2px solid ${T.accent}; outline-offset: 2px; }
  .btn-primary { background: ${T.accent}; color: #fff; border: none; }
  .btn-primary:hover { box-shadow: 0 8px 24px rgba(39,66,236,.28); }
  .btn-ghost { background: transparent; color: ${T.ink}; border: 1px solid ${T.border}; }
  .btn-ghost:hover { border-color: ${T.ink}; }
  .path-edge { stroke-dasharray: 7 7; animation: dashFlow 1s linear infinite; }
  .row-hover { transition: background .15s; }
  .row-hover:hover { background: ${T.accentSoft}; }
  .navlink { color: ${T.muted}; font-size: 14px; text-decoration: none; cursor: pointer; background:none; border:none; font-family: inherit; padding: 6px 2px; transition: color .2s; }
  .navlink:hover, .navlink.active { color: ${T.ink}; }
  .navlink.active { font-weight: 600; }
  @media (prefers-reduced-motion: reduce) {
    *, .fade-up, .reveal, .path-edge { animation: none !important; transition: none !important; }
    .reveal { opacity: 1; transform: none; }
  }
`;

/* ---------------- graph math ---------------- */
function buildAdj(nodes, edges) {
  const adj = new Map();
  nodes.forEach((n) => adj.set(n.id, new Set()));
  edges.forEach((e) => {
    if (adj.has(e.a) && adj.has(e.b) && e.a !== e.b) {
      adj.get(e.a).add(e.b);
      adj.get(e.b).add(e.a);
    }
  });
  return adj;
}

function bfsDistances(adj, src) {
  const dist = new Map([[src, 0]]);
  const q = [src];
  for (let i = 0; i < q.length; i++) {
    for (const v of adj.get(q[i])) {
      if (!dist.has(v)) { dist.set(v, dist.get(q[i]) + 1); q.push(v); }
    }
  }
  return dist;
}

function shortestPath(adj, src, dst) {
  if (!adj.has(src) || !adj.has(dst)) return null;
  const prev = new Map([[src, null]]);
  const q = [src];
  for (let i = 0; i < q.length; i++) {
    if (q[i] === dst) break;
    for (const v of adj.get(q[i])) {
      if (!prev.has(v)) { prev.set(v, q[i]); q.push(v); }
    }
  }
  if (!prev.has(dst)) return null;
  const path = [];
  for (let cur = dst; cur !== null; cur = prev.get(cur)) path.unshift(cur);
  return path;
}

function computeCentrality(nodes, edges) {
  const t0 = performance.now();
  const adj = buildAdj(nodes, edges);
  const ids = nodes.map((n) => n.id);
  const N = ids.length;
  const deg = {}, clo = {}, bet = {}, eig = {};
  ids.forEach((id) => { deg[id] = 0; clo[id] = 0; bet[id] = 0; eig[id] = 1; });
  let diameter = 0;

  ids.forEach((id) => { deg[id] = N > 1 ? adj.get(id).size / (N - 1) : 0; });

  ids.forEach((id) => {
    const d = bfsDistances(adj, id);
    let sum = 0;
    d.forEach((v) => { sum += v; if (v > diameter) diameter = v; });
    clo[id] = sum > 0 ? (d.size - 1) / sum : 0;
  });

  // Brandes' betweenness (unweighted)
  ids.forEach((s) => {
    const stack = [], pred = new Map(), sigma = new Map(), dist = new Map();
    ids.forEach((v) => { pred.set(v, []); sigma.set(v, 0); dist.set(v, -1); });
    sigma.set(s, 1); dist.set(s, 0);
    const q = [s];
    for (let i = 0; i < q.length; i++) {
      const v = q[i];
      stack.push(v);
      for (const w of adj.get(v)) {
        if (dist.get(w) < 0) { dist.set(w, dist.get(v) + 1); q.push(w); }
        if (dist.get(w) === dist.get(v) + 1) {
          sigma.set(w, sigma.get(w) + sigma.get(v));
          pred.get(w).push(v);
        }
      }
    }
    const delta = new Map(ids.map((v) => [v, 0]));
    while (stack.length) {
      const w = stack.pop();
      for (const v of pred.get(w))
        delta.set(v, delta.get(v) + (sigma.get(v) / sigma.get(w)) * (1 + delta.get(w)));
      if (w !== s) bet[w] += delta.get(w);
    }
  });
  const norm = N > 2 ? (N - 1) * (N - 2) : 1;
  ids.forEach((id) => { bet[id] /= norm; });

  // Eigenvector — power iteration
  for (let it = 0; it < 100; it++) {
    const next = {}; let max = 0;
    ids.forEach((id) => {
      let s = 0;
      adj.get(id).forEach((nb) => { s += eig[nb]; });
      next[id] = s; if (s > max) max = s;
    });
    if (max === 0) break;
    ids.forEach((id) => { eig[id] = next[id] / max; });
  }

  return {
    deg, clo, bet, eig, adj,
    density: N > 1 ? (2 * edges.length) / (N * (N - 1)) : 0,
    diameter,
    ms: performance.now() - t0,
  };
}

/* ---------------- graph generators ---------------- */
const ring = (ids, cx = 420, cy = 280, r = 190) =>
  ids.map((id, i) => ({
    id,
    x: cx + r * Math.cos((i / ids.length) * Math.PI * 2),
    y: cy + r * Math.sin((i / ids.length) * Math.PI * 2),
    vx: 0, vy: 0,
  }));

const GENERATORS = {
  social: () => {
    const names = ["Asha","Ravi","Meera","Karan","Divya","Imran","Tara","Nikhil","Priya","Vikram","Sana","Arjun"];
    const pairs = [["Asha","Ravi"],["Asha","Meera"],["Ravi","Meera"],["Meera","Karan"],["Karan","Divya"],
      ["Karan","Imran"],["Divya","Imran"],["Imran","Tara"],["Tara","Nikhil"],["Tara","Priya"],
      ["Nikhil","Priya"],["Priya","Vikram"],["Vikram","Sana"],["Sana","Arjun"],["Vikram","Arjun"],
      ["Meera","Tara"],["Asha","Karan"]];
    return { nodes: ring(names), edges: pairs.map(([a, b]) => ({ a, b })) };
  },
  bridge: () => {
    const A = ["A1","A2","A3","A4","A5","A6"], B = ["B1","B2","B3","B4","B5","B6"];
    const edges = [];
    const clique = (g) => {
      for (let i = 0; i < g.length; i++)
        for (let j = i + 1; j < g.length; j++)
          if (Math.random() < 0.7) edges.push({ a: g[i], b: g[j] });
    };
    clique(A); clique(B);
    edges.push({ a: "A1", b: "Hub" }, { a: "Hub", b: "B1" });
    return {
      nodes: [...ring(A, 260, 280, 120), ...ring(B, 580, 280, 120), { id: "Hub", x: 420, y: 280, vx: 0, vy: 0 }],
      edges,
    };
  },
  star: () => {
    const ids = Array.from({ length: 11 }, (_, i) => (i === 0 ? "Core" : `S${i}`));
    return { nodes: ring(ids), edges: ids.slice(1).map((id) => ({ a: "Core", b: id })) };
  },
  random: () => {
    const ids = Array.from({ length: 16 }, (_, i) => `R${i + 1}`);
    const edges = [];
    for (let i = 1; i < ids.length; i++)
      edges.push({ a: ids[i], b: ids[Math.floor(Math.random() * i)] });
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++)
        if (Math.random() < 0.08) edges.push({ a: ids[i], b: ids[j] });
    return { nodes: ring(ids), edges };
  },
};

/* ---------------- single-hue color ramp (pale slate -> cobalt) ---------------- */
function rampColor(t) {
  const c = T.rampLo.map((v, i) => Math.round(v + (T.rampHi[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/* ---------------- scroll reveal ---------------- */
function Reveal({ children, delay = 0, style }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("in"); io.disconnect(); } },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="reveal" style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

/* ================== THE LAB ================== */
function GraphLab({ height = 560 }) {
  const [graph, setGraph] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("plexus-graph") || "null");
      if (saved?.nodes?.length) return saved;
    } catch {}
    return GENERATORS.social();
  });
  const [metric, setMetric] = useState("bet");
  const [mode, setMode] = useState("path");
  const [selected, setSelected] = useState([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [hovered, setHovered] = useState(null);
  const [, setTick] = useState(0);

  const simRef = useRef({ alpha: 1 });
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const graphRef = useRef(graph);
  graphRef.current = graph;

  useEffect(() => {
    try { localStorage.setItem("plexus-graph", JSON.stringify(graph)); } catch {}
  }, [graph]);

  const stats = useMemo(() => computeCentrality(graph.nodes, graph.edges), [graph]);
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

  /* force simulation */
  useEffect(() => {
    let raf;
    const step = () => {
      const sim = simRef.current, g = graphRef.current;
      if (sim.alpha > 0.01) {
        const ns = g.nodes;
        for (let i = 0; i < ns.length; i++)
          for (let j = i + 1; j < ns.length; j++) {
            const a = ns[i], b = ns[j];
            let dx = b.x - a.x, dy = b.y - a.y;
            const d2 = dx * dx + dy * dy || 1, d = Math.sqrt(d2);
            const f = 2800 / d2;
            dx /= d; dy /= d;
            a.vx -= dx * f; a.vy -= dy * f;
            b.vx += dx * f; b.vy += dy * f;
          }
        const byId = new Map(ns.map((n) => [n.id, n]));
        g.edges.forEach((e) => {
          const a = byId.get(e.a), b = byId.get(e.b);
          if (!a || !b) return;
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          const f = (d - 115) * 0.02;
          a.vx += (dx / d) * f; a.vy += (dy / d) * f;
          b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
        });
        ns.forEach((n) => {
          if (dragRef.current === n.id) { n.vx = 0; n.vy = 0; return; }
          n.vx += (420 - n.x) * 0.0012;
          n.vy += (280 - n.y) * 0.0012;
          n.vx *= 0.85; n.vy *= 0.85;
          n.x += n.vx * sim.alpha;
          n.y += n.vy * sim.alpha;
        });
        sim.alpha *= 0.996;
        setTick((t) => t + 1);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const reheat = () => { simRef.current.alpha = 1; };
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

/* ================== SHARED DATA ================== */
const PLANS = [
  { name: "Explorer", price: "₹0", per: "forever",
    points: ["Up to 50 nodes", "All four centrality metrics", "Shortest-path tracing", "Graph presets & build mode", "Saves in your browser"],
    cta: "Start exploring", featured: false },
  { name: "Analyst", price: "₹499", per: "per month",
    points: ["Unlimited nodes & graphs", "CSV import & export", "Critical-node reports", "Weighted edges (soon)", "Priority email support"],
    cta: "Upgrade to Analyst", featured: true },
  { name: "Org", price: "₹1,999", per: "per month",
    points: ["Everything in Analyst", "Shared team workspaces", "Read-only share links", "Onboarding session", "Invoice billing"],
    cta: "Talk to us", featured: false },
];

const METRICS_INFO = [
  ["Degree", "Who has the most connections?", "Raw popularity — direct links divided by everyone they could link to."],
  ["Closeness", "Who can reach everyone fastest?", "Inverse of total shortest-path distance to every other node."],
  ["Betweenness", "Who do messages pass through?", "How often a node sits on the shortest path between two others — the brokers and bottlenecks."],
  ["Eigenvector", "Who knows the important people?", "Influence by association — your score grows when your neighbours' scores grow."],
];

const FAQS = [
  ["Is my data uploaded anywhere?", "No. Plexus has no backend — parsing, algorithms, and rendering all run inside your browser tab. Close the tab and only your local save remains."],
  ["What formats can I import?", "Plain edge lists: one pair per line, separated by a comma or space. CSV exports from Excel, Sheets, or any database work directly."],
  ["How big can my graph be?", "The from-scratch algorithms comfortably handle a few hundred nodes in real time. The compute readout in the lab shows you exact milliseconds."],
  ["Which algorithm powers betweenness?", "Brandes' algorithm — O(V·E) instead of the naive O(V³), which is why numbers update instantly as you edit the graph."],
  ["Can I cancel a paid plan?", "Anytime, from settings, no questions. Your graphs stay in your browser either way — we literally never had them."],
];

/* ================== APP / PAGES ================== */
export default function App() {
  const [page, setPage] = useState("home"); // home | pricing | app
  const [openFaq, setOpenFaq] = useState(null);

  const go = (p) => { setPage(p); window.scrollTo({ top: 0 }); };

  const Logo = (
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

  const Nav = (
    <nav style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(247,247,244,0.85)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "14px 24px", maxWidth: 1140, margin: "0 auto" }}>
        {Logo}
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

  /* ---------- LAB PAGE ---------- */
  if (page === "app") {
    return (
      <div style={{ background: T.bg, minHeight: "100vh", color: T.ink, fontFamily: T.sans }}>
        <style>{STYLES}</style>
        {Nav}
        <div className="fade-up" style={{ maxWidth: 1140, margin: "0 auto", padding: "24px 24px 48px" }}>
          <GraphLab height={640} />
        </div>
      </div>
    );
  }

  /* ---------- PRICING PAGE ---------- */
  if (page === "pricing") {
    return (
      <div style={{ background: T.bg, minHeight: "100vh", color: T.ink, fontFamily: T.sans }}>
        <style>{STYLES}</style>
        {Nav}

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
      </div>
    );
  }

  /* ---------- HOME PAGE ---------- */
  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.ink, fontFamily: T.sans }}>
      <style>{STYLES}</style>
      {Nav}

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
          {[
            ["The product is the proof", "No demo video, no screenshots. The full engine runs on this page — every number you see was just computed in your tab."],
            ["Built for real graphs", "Org charts, microservice meshes, flight routes, transaction webs. Paste a CSV or sketch it node-by-node in build mode."],
            ["Private by architecture", "There is no server to trust. Parsing, Brandes' algorithm, layout physics — all client-side. Proprietary data stays proprietary."],
          ].map(([h, p], i) => (
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
    </div>
  );
}
