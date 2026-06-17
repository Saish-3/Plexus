import { useReveal } from "../hooks/useReveal";

/* Fades + slides children in when they scroll into view. */
export function Reveal({ children, delay = 0, style }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal" style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  );
}
