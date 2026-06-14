<div align="center">

# 🔷 PLEXUS

### *See what holds your network together.*

**A from-scratch network-centrality lab that turns any edge list into a living, interactive graph — and ranks every node by four classic centrality metrics, computed entirely in your browser.**

`React 18` · `Vite` · `Zero runtime dependencies` · `100% client-side`

---

</div>

## 📄 Cover Page

| | |
|---|---|
| **Project Title** | Plexus — Network Centrality Visualizer |
| **Type** | Single-Page React Application (Frontend Capstone) |
| **Tagline** | *Every network has a center of gravity. Find yours.* |
| **Repository** | `React/project` |
| **Build Tool** | Vite 5 |
| **Framework** | React 18 |

---

## 👤 Student Details

| Field | Detail |
|---|---|
| **Name** | Saish Bhujbal |
| **Roll / ID No.** | 150096725063 |
| **Cohort** | Jeff Bezos |

---

## ❓ Problem Statement

Networks are everywhere — social circles, microservice meshes, transaction trails, org charts — yet the most important questions about them are hard to answer by eye:

- **Who is the most connected person?**
- **Who can reach everyone else the fastest?**
- **Who acts as the critical bridge that messages must pass through?**
- **Who is influential because they know other influential people?**

Most existing network-analysis tools are either heavyweight desktop applications, require uploading sensitive data to a server, or hide their math behind opaque libraries.

**Plexus solves this** by providing a lightweight, private, in-browser lab that:

1. Accepts any network as a simple edge list (typed, pasted, or built node-by-node).
2. Computes **four centrality metrics from scratch** — no graph libraries — so the algorithms are transparent and educational.
3. Renders the result as a real-time, force-directed, draggable visualization.
4. **Never sends your data anywhere** — there is no backend. Everything runs in the browser tab.

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **UI Library** | React 18 (Hooks) | Declarative components, fine-grained state |
| **Build / Dev Server** | Vite 5 | Instant HMR, fast ESM-based builds |
| **Bundler Plugin** | `@vitejs/plugin-react` | JSX + Fast Refresh |
| **Rendering** | Native SVG | Crisp, scalable graph rendering without a canvas library |
| **Styling** | Inline styles + injected CSS keyframes | Design tokens, zero CSS framework |
| **Persistence** | Browser `localStorage` | Graphs survive reloads, stay private |
| **Algorithms** | Hand-written JavaScript | BFS, Brandes' betweenness, closeness, eigenvector, force layout |
| **Dependencies** | **Only** `react` + `react-dom` | No D3, no graph libs — proof of concept |

---

## 🧩 Component Architecture

The entire application lives as a single, self-contained React tree rooted in [App.jsx](src/App.jsx), mounted via [main.jsx](src/main.jsx).

```
index.html
└── main.jsx                 (React root + StrictMode)
    └── <App>                (top-level router: "home" | "pricing" | "app")
        │
        ├── Nav               (sticky header, page switching, brand logo)
        │
        ├── HOME page         (hero + live <GraphLab> + feature trio + metrics explainer + CTA)
        ├── PRICING page      (plan cards + comparison strip + FAQ accordion)
        └── LAB page          (full-size <GraphLab>)
                │
                └── <GraphLab>          ★ the core engine
                     ├── Toolbar        (metric chips, Trace/Build modes, presets, import/export)
                     ├── SVG Canvas     (force-directed nodes + edges, drag, click-to-trace)
                     ├── Side Panel     (critical bridges + sortable centrality ranking table)
                     ├── Telemetry Bar  (nodes, edges, density, diameter, compute time)
                     └── Import Modal    (paste an edge list)

        └── <Reveal>          (reusable scroll-reveal wrapper using IntersectionObserver)
```

### Key modules inside [App.jsx](src/App.jsx)

| Module | Responsibility |
|---|---|
| **Design Tokens (`T`)** | Single source of colors, fonts, and the color ramp |
| **Graph Math** | `buildAdj`, `bfsDistances`, `shortestPath`, `computeCentrality` |
| **Graph Generators** | `social`, `bridge`, `star`, `random` preset networks |
| **`GraphLab`** | Stateful interactive lab — simulation loop, editing, metrics, export |
| **`Reveal`** | Animation-on-scroll helper component |
| **`App`** | Page routing, navigation, marketing pages |

### Algorithms (written from scratch)

- **BFS** — shortest-path distances & path reconstruction
- **Degree centrality** — normalized direct connections
- **Closeness centrality** — inverse of total distance to all nodes
- **Betweenness centrality** — **Brandes' algorithm** (`O(V·E)` instead of naive `O(V³)`)
- **Eigenvector centrality** — power iteration (100 steps)
- **Force-directed layout** — repulsion + spring + centering physics on `requestAnimationFrame`

---

## ✨ Features

- 🎯 **Four centrality metrics** — Degree, Closeness, Betweenness, Eigenvector, toggled live.
- 🌐 **Real-time force-directed layout** — nodes physically settle; drag any node and watch it reflow.
- 🔍 **Shortest-path tracing** — click two nodes to highlight and animate the route between them.
- 🏗️ **Build mode** — click empty space to add a node, click two nodes to connect, double-click to delete.
- 📊 **Live ranking panel** — sortable table of every node scored by the active metric.
- 🌉 **Critical bridges callout** — instantly surfaces the top brokers by betweenness.
- 📥 **Import edge lists** — paste `source,target` pairs (CSV / space / comma separated).
- 📤 **Export to CSV** — download all four metrics per node.
- 🎛️ **Preset networks** — Social circle, Two communities + broker, Star, Random.
- 💾 **Auto-save** — graphs persist in `localStorage`.
- 📈 **Telemetry readout** — nodes, edges, density, diameter, and exact compute time in ms.
- 🔒 **100% private** — no backend, no uploads; all computation runs client-side.
- ♿ **Accessible & responsive** — keyboard focus styles, `prefers-reduced-motion` support, fluid layout.

---

## 📸 Screenshots

> Add your captured images to a `screenshots/` folder and they will render below.

| View | Preview |
|---|---|
| **Home / Hero** | `![Home](screenshots/home.png)` |
| **The Lab — Betweenness view** | `![Lab](screenshots/lab.png)` |
| **Shortest-path tracing** | `![Trace](screenshots/trace.png)` |
| **Pricing page** | `![Pricing](screenshots/pricing.png)` |

<!--
Replace the code spans above with real images once captured, e.g.:
![Home](screenshots/home.png)
-->

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (http://localhost:5173)
npm run dev

# 3. Build for production
npm run build

# 4. Preview the production build
npm run preview
```

**Requirements:** Node.js 16+ and npm.

---

## 🏁 Conclusion

Plexus demonstrates that a genuinely useful, polished network-analysis tool can be built with **nothing more than React and hand-written algorithms** — no graph libraries, no backend, and no compromise on privacy. By implementing BFS, Brandes' betweenness, closeness, eigenvector centrality, and a force-directed layout from first principles, the project doubles as both a **practical product** and an **educational reference** for how centrality is actually computed.

The result is a fast, private, and interactive lab where the product *is* the proof: every number on screen was just calculated, live, in the user's own browser tab.

**Possible future enhancements:** weighted edges, community detection, directed graphs, larger-scale performance via Web Workers, and shareable read-only links.

---

<div align="center">

*Plexus · centrality computed where your data lives.*

**Built by Saish Bhujbal · Cohort Jeff Bezos**

</div>
