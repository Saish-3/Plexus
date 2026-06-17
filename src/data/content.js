/* ================== SHARED CONTENT ================== */

export const PLANS = [
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

export const METRICS_INFO = [
  ["Degree", "Who has the most connections?", "Raw popularity — direct links divided by everyone they could link to."],
  ["Closeness", "Who can reach everyone fastest?", "Inverse of total shortest-path distance to every other node."],
  ["Betweenness", "Who do messages pass through?", "How often a node sits on the shortest path between two others — the brokers and bottlenecks."],
  ["Eigenvector", "Who knows the important people?", "Influence by association — your score grows when your neighbours' scores grow."],
];

export const FAQS = [
  ["Is my data uploaded anywhere?", "No. Plexus has no backend — parsing, algorithms, and rendering all run inside your browser tab. Close the tab and only your local save remains."],
  ["What formats can I import?", "Plain edge lists: one pair per line, separated by a comma or space. CSV exports from Excel, Sheets, or any database work directly."],
  ["How big can my graph be?", "The from-scratch algorithms comfortably handle a few hundred nodes in real time. The compute readout in the lab shows you exact milliseconds."],
  ["Which algorithm powers betweenness?", "Brandes' algorithm — O(V·E) instead of the naive O(V³), which is why numbers update instantly as you edit the graph."],
  ["Can I cancel a paid plan?", "Anytime, from settings, no questions. Your graphs stay in your browser either way — we literally never had them."],
];
