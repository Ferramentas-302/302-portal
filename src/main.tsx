import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./styles.css";
import ClientLayout from "./pages/client/ClientLayout";
import Inicio from "./pages/client/Inicio";
import Criativos from "./pages/client/Criativos";
import Desempenho from "./pages/client/Desempenho";
import Diario from "./pages/client/Diario";
const MestreLayout = lazy(() => import("./pages/mestre/MestreLayout"));
const Clientes = lazy(() => import("./pages/mestre/Clientes"));
const DiarioFila = lazy(() => import("./pages/mestre/DiarioFila"));

function Home() {
  return (
    <div className="center-screen">
      <div>
        <img src="/logo-302.png" alt="302 digital" />
        <span style={{ width: 48, height: 4, borderRadius: 999, background: "var(--orange)" }} aria-hidden="true" />
        <h1 style={{ fontSize: 24 }}>Portal de resultados</h1>
        <p className="sub">Acesse pelo link exclusivo que a equipe da 302 digital enviou para você.</p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/c/:token" element={<ClientLayout />}>
          <Route index element={<Inicio />} />
          <Route path="criativos" element={<Criativos />} />
          <Route path="desempenho" element={<Desempenho />} />
          <Route path="diario" element={<Diario />} />
        </Route>
        <Route path="/mestre" element={<Suspense fallback={null}><MestreLayout /></Suspense>}>
          <Route index element={<Suspense fallback={null}><Clientes /></Suspense>} />
          <Route path="diario" element={<Suspense fallback={null}><DiarioFila /></Suspense>} />
        </Route>
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
