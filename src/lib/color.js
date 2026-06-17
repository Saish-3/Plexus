import { T } from "../theme/tokens";

/* single-hue color ramp (pale slate -> cobalt) */
export function rampColor(t) {
  const c = T.rampLo.map((v, i) => Math.round(v + (T.rampHi[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
