import { useEffect, useRef, useState } from "react";

/* Force-directed layout. Mutates node x/y/vx/vy in place on a
   requestAnimationFrame loop and forces a re-render each tick.

   Returns:
     simRef  — { alpha } cooling factor; bump it to keep simulating
     dragRef — set .current to a node id to pin it under the cursor
     reheat  — restart the simulation at full energy */
export function useForceSimulation(graph) {
  const simRef = useRef({ alpha: 1 });
  const dragRef = useRef(null);
  const graphRef = useRef(graph);
  graphRef.current = graph;
  const [, setTick] = useState(0);

  useEffect(() => {
    let raf;
    const step = () => {
      const sim = simRef.current, g = graphRef.current;
      if (sim.alpha > 0.01) {
        const ns = g.nodes;
        // repulsion between every pair
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
        // spring attraction along edges
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
        // integrate + gravity toward center
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

  return { simRef, dragRef, reheat };
}
