/* ---------------- graph math ----------------
   From-scratch algorithms: BFS, Brandes betweenness,
   closeness, degree, eigenvector. Zero dependencies. */

export function buildAdj(nodes, edges) {
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

export function bfsDistances(adj, src) {
  const dist = new Map([[src, 0]]);
  const q = [src];
  for (let i = 0; i < q.length; i++) {
    for (const v of adj.get(q[i])) {
      if (!dist.has(v)) { dist.set(v, dist.get(q[i]) + 1); q.push(v); }
    }
  }
  return dist;
}

export function shortestPath(adj, src, dst) {
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

export function computeCentrality(nodes, edges) {
  const t0 = performance.now();
  const adj = buildAdj(nodes, edges);
  const ids = nodes.map((n) => n.id);
  const N = ids.length;
  const deg = {}, clo = {}, bet = {}, eig = {};
  ids.forEach((id) => { deg[id] = 0; clo[id] = 0; bet[id] = 0; eig[id] = 1; });
  let diameter = 0;

  // Raw degree: the actual number of incident edges (no /(N-1) normalization).
  ids.forEach((id) => { deg[id] = adj.get(id).size; });

  ids.forEach((id) => {
    const d = bfsDistances(adj, id);
    let sum = 0;
    d.forEach((v) => { sum += v; if (v > diameter) diameter = v; });
    // Raw closeness: 1 / Σ(distance), without the (reachable-1) size scaling.
    clo[id] = sum > 0 ? 1 / sum : 0;
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
  // Raw betweenness: the count of shortest paths passing through each node.
  // We drop the (N-1)(N-2) normalization. The /2 is NOT normalization — it
  // corrects the double-count inherent to undirected Brandes (every pair is
  // accumulated once from each endpoint as source), recovering the true count.
  ids.forEach((id) => { bet[id] /= 2; });

  // Eigenvector — power iteration. The per-iteration /max is intrinsic to the
  // solver (it keeps the vector bounded as it converges), not a display-time
  // normalization, so it stays — this IS the raw score the algorithm produces.
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
