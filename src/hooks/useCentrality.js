import { useMemo } from "react";
import { computeCentrality } from "../lib/graph";

/* Memoized centrality stats for a graph. */
export function useCentrality(graph) {
  return useMemo(() => computeCentrality(graph.nodes, graph.edges), [graph]);
}
