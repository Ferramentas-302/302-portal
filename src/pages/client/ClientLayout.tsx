import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { fetchPortal, NotFoundError, type Channel, type PeriodKey, type PortalData, type Query } from "../../api";
import { Icon } from "../../components/ui";

export type ClientCtx = {
  token: string;
  data: PortalData | null;
  loading: boolean;
  error: string | null;
  query: Query;
  setQuery: (q: Query) => void;
};
export const useClient = () => useOutletContext<ClientCtx>();

const PERIODS: PeriodKey[] = ["hoje", "7d", "30d", "mes", "custom"];

export default function ClientLayout() {
  const { token = "" } = useParams();
  const [sp, setSp] = useSearchParams();
  const query: Query = {
    period: (PERIODS.includes(sp.get("p") as PeriodKey) ? sp.get("p") : "7d") as PeriodKey,
    channel: (["all", "meta", "google"].includes(sp.get("c") ?? "") ? sp.get("c") : "all") as Channel,
    since: sp.get("de") ?? undefined,
    until: sp.get("ate") ?? undefined,
  };
  const key = `${query.period}|${query.channel}|${query.since}|${query.until}`;
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetchPortal(token, query, ctrl.signal)
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => {
        if (ctrl.signal.aborted) return;
        if (e instanceof NotFoundError) setNotFound(true);
        else setError("Não foi possível carregar os dados agora. Tente de novo em instantes.");
        setLoading(false);
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, key]);

  // atualiza sozinho a cada 10 min com a página aberta
  useEffect(() => {
    const id = setInterval(() => fetchPortal(token, query).then(setData).catch(() => {}), 10 * 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, key]);

  const setQuery = useCallback((q: Query) => {
    const n = new URLSearchParams();
    if (q.period !== "7d") n.set("p", q.period);
    if (q.channel !== "all") n.set("c", q.channel);
    if (q.period === "custom" && q.since && q.until) { n.set("de", q.since); n.set("ate", q.until); }
    setSp(n, { replace: true });
  }, [setSp]);

  useEffect(() => {
    document.title = data?.cliente.nome ? `${data.cliente.nome} · Portal de resultados 302` : "Portal de resultados · 302 digital";
  }, [data?.cliente.nome]);

  if (notFound) {
    return (
      <div className="center-screen">
        <div>
          <img src="/logo-302.png" alt="302 digital" />
          <h1 style={{ fontSize: 22 }}>Link indisponível</h1>
          <p className="sub">Este endereço não está ativo. Fale com a equipe da 302 digital para receber o link atualizado.</p>
        </div>
      </div>
    );
  }

  const qs = sp.toString() ? `?${sp}` : "";
  const base = `/c/${token}`;
  const tabs = [
    { to: base, label: "Início", icon: Icon.home, end: true },
    { to: `${base}/criativos`, label: "Criativos", icon: Icon.grid },
    { to: `${base}/desempenho`, label: "Desempenho", icon: Icon.chart },
    { to: `${base}/diario`, label: "Diário", icon: Icon.diary },
  ];

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <img src="/logo-302.png" alt="302 digital" />
          <nav className="topnav" aria-label="Seções">
            {tabs.map((t) => (
              <NavLink key={t.to} to={t.to + qs} end={t.end} className={({ isActive }) => (isActive ? "active" : "")}>
                {t.label === "Criativos" && <span className="live-dot" style={{ width: 8, height: 8, boxShadow: "0 0 0 3px rgba(34,160,90,.18)" }} aria-hidden="true" />}
                {t.label === "Criativos" ? "Criativos ativos" : t.label}
              </NavLink>
            ))}
          </nav>
          <span className="client-name">{data?.cliente.nome ?? ""}</span>
        </div>
      </header>
      {data?.preview && <div className="banner" style={{ borderRadius: 0, textAlign: "center" }}>Prévia do mestre — este portal ainda está desligado para o cliente.</div>}
      <Outlet context={{ token, data, loading, error, query, setQuery } satisfies ClientCtx} />
      <nav className="tabbar" aria-label="Navegação">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to + qs} end={t.end} className={({ isActive }) => (isActive ? "active" : "")}>
            {t.icon}
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
