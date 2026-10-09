import { Link } from "react-router-dom";
import { BalanceCard, ChannelChips, PeriodPicker, Skeleton, SpendChart } from "../../components/ui";
import { ago, delta, money, num, resultLabel, stamp } from "../../format";
import { useClient } from "./ClientLayout";

export default function Inicio() {
  const { data, loading, error, query, setQuery, token } = useClient();
  const d = data;
  const cur = d?.kpis.atual.total, prev = d?.kpis.anterior.total;
  const obj = d?.cliente.objetivo ?? "leads";
  const firstName = d?.cliente.nome ?? "";
  const qs = new URLSearchParams(window.location.search).toString();

  return (
    <main className="page">
      <div className="page-head">
        <h1>{firstName ? `Olá, ${firstName}` : "Olá"}</h1>
        <p className="sub">{d ? `Dados atualizados em ${stamp(d.atualizado_em)} (${ago(d.atualizado_em)})` : "Carregando seus resultados…"}</p>
      </div>

      <div className="controls">
        <PeriodPicker query={query} range={d?.periodo.atual ?? null} onChange={setQuery} />
        <ChannelChips value={query.channel} hasGoogle={!!d?.cliente.tem_google} onChange={(c) => setQuery({ ...query, channel: c })} />
      </div>

      {error && <div className="banner">{error}</div>}

      {loading && !d ? (
        <div className="grid-kpi"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>
      ) : d && cur && prev ? (
        <>
          <section className="grid-kpi" aria-label="Resumo do período" style={{ opacity: loading ? 0.6 : 1 }}>
            <div className="kpi hero">
              <span className="l">{resultLabel(obj)} recebidos</span>
              <span className="v">{num(cur.results)}</span>
              <span className="d">{delta(cur.results, prev.results) ?? "—"} vs período anterior ({num(prev.results)})</span>
            </div>
            <div className="kpi"><span className="l">Investimento</span><span className="v">{money(cur.spend)}</span><span className="d">{delta(cur.spend, prev.spend) ?? "—"} ({money(prev.spend)})</span></div>
            <div className="kpi"><span className="l">Custo por {resultLabel(obj, false)}</span><span className="v">{money(cur.cpr)}</span><span className="d">{delta(cur.cpr, prev.cpr) ?? "—"} ({money(prev.cpr)})</span></div>
            <div className="kpi"><span className="l">Impressões</span><span className="v">{num(cur.impressions)}</span><span className="d">{delta(cur.impressions, prev.impressions) ?? "—"} ({num(prev.impressions)})</span></div>
            <div className="kpi"><span className="l">Visualizações de vídeo</span><span className="v">{num(cur.video_views)}</span><span className="d">{delta(cur.video_views, prev.video_views) ?? "—"} ({num(prev.video_views)})</span></div>
          </section>
          {(d.kpis.alcance.atual != null || cur.thruplays > 0) && query.channel !== "google" && (
            <p className="note">
              {d.kpis.alcance.atual != null && <>Seus anúncios alcançaram <strong style={{ color: "var(--ink)" }}>{num(d.kpis.alcance.atual)} pessoas</strong> no Meta. </>}
              {cur.thruplays > 0 && <>{num(cur.thruplays)} visualizações foram até o fim do vídeo (ou passaram de 15 segundos).</>}
            </p>
          )}

          {d.cliente.tem_google && query.channel === "all" && (
            <section className="card" aria-label="Por canal">
              <h2>Por canal</h2>
              <div className="split-bar" aria-hidden="true">
                <div style={{ width: `${cur.spend ? (d.kpis.atual.meta.spend / cur.spend) * 100 : 0}%`, background: "var(--orange)" }} />
                <div style={{ width: `${cur.spend ? (d.kpis.atual.google.spend / cur.spend) * 100 : 0}%`, background: "var(--ink)" }} />
              </div>
              <div className="channel-row"><span className="dot" style={{ background: "var(--orange)" }} />Meta (Instagram e Facebook)</div>
              <div className="mini-grid">
                <div>Investido<strong>{money(d.kpis.atual.meta.spend)}</strong></div>
                <div>{resultLabel(obj)}<strong>{num(d.kpis.atual.meta.results)}</strong></div>
                <div>Por {resultLabel(obj, false)}<strong>{money(d.kpis.atual.meta.cpr)}</strong></div>
              </div>
              <div className="sep" />
              <div className="channel-row"><span className="dot" style={{ background: "var(--ink)" }} />Google (Pesquisa)</div>
              <div className="mini-grid">
                <div>Investido<strong>{money(d.kpis.atual.google.spend)}</strong></div>
                <div>Cliques<strong>{num(d.kpis.atual.google.clicks)}</strong></div>
                <div>{resultLabel(obj)}<strong>{num(d.kpis.atual.google.results)}</strong></div>
              </div>
            </section>
          )}

          <section className="card" aria-label="Últimos 30 dias">
            <div className="card-head"><h2>Últimos 30 dias</h2><Link to={`/c/${token}/desempenho${qs ? `?${qs}` : ""}`}>Ver evolução</Link></div>
            <div className="chart-legend">
              <span><span className="dot" style={{ background: "var(--orange)", borderRadius: 2 }} />{resultLabel(obj)} por dia</span>
              <span><span style={{ width: 14, height: 2, background: "var(--ink)" }} />Investimento</span>
            </div>
            <SpendChart data={d.serie_30d} highlight={d.periodo.atual} />
          </section>

          {query.channel !== "google" && (
            <section className="card" aria-label="Criativos ativos">
              <div className="card-head">
                <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}><span className="live-dot" aria-hidden="true" />Criativos ativos · {d.criativos_ativos.length}</h2>
                <Link to={`/c/${token}/criativos${qs ? `?${qs}` : ""}`}>Ver todos</Link>
              </div>
              {d.criativos_ativos.length ? (
                <div className="thumbs-3 preview">
                  {d.criativos_ativos.slice(0, 6).map((c) => c.thumb ? <img key={c.key} src={c.thumb} alt={c.title ?? "Criativo"} loading="lazy" /> : <div key={c.key} className="skeleton" style={{ aspectRatio: "1" }} />)}
                </div>
              ) : <p className="empty">Nenhum criativo rodando agora.</p>}
            </section>
          )}

          {query.channel !== "google" && d.saldo.map((b) => <BalanceCard key={b.updated_at + b.platform + b.payment_label} b={b} />)}
        </>
      ) : null}
    </main>
  );
}
