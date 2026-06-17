import { useEffect, useState } from "react";
import { GENERATORS } from "../lib/generators";

const STORAGE_KEY = "plexus-graph";

/* Graph state backed by localStorage. Falls back to the
   social preset when nothing valid is saved. */
export function usePersistentGraph() {
  const [graph, setGraph] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved?.nodes?.length) return saved;
    } catch { /* ignore corrupt save */ }
    return GENERATORS.social();
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(graph)); } catch { /* quota / private mode */ }
  }, [graph]);

  return [graph, setGraph];
}
