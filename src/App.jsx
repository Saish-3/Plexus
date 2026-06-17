import { useState } from "react";
import { T } from "./theme/tokens";
import { Nav } from "./components/Nav";
import { Home } from "./pages/Home";
import { Pricing } from "./pages/Pricing";
import { Lab } from "./pages/Lab";

/* ================== PLEXUS — see what holds your network together ==================
   Pages: Home · Pricing · Lab.
   App is just the shell + router; each concern lives in its own module:
     theme/    design tokens + CSS-variable bridge
     styles/   global stylesheet (imported in main.jsx)
     lib/      from-scratch graph algorithms, generators, color ramp
     hooks/    one custom hook per file
     data/     static page content
     components/ + pages/   UI
==================================================================================== */
export default function App() {
  const [page, setPage] = useState("home"); // home | pricing | app

  const go = (p) => { setPage(p); window.scrollTo({ top: 0 }); };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.ink, fontFamily: T.sans }}>
      <Nav page={page} go={go} />
      {page === "home" && <Home go={go} />}
      {page === "pricing" && <Pricing go={go} />}
      {page === "app" && <Lab />}
    </div>
  );
}
