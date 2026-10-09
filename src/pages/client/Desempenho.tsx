import { ChannelChips, PeriodPicker, Skeleton, SpendChart } from "../../components/ui";
import { money, num, resultLabel } from "../../format";
import { useClient } from "./ClientLayout";

const MEDAL = ["var(--orange)", "var(--tan)", "var(--cream)", "var(--line)", "var(--line)"];

export default function Desempenho() {
  const { data, loading, error, query, setQuery } = useClient();
  const d = data;
  const obj = d?.cliente.objetivo ?? "leads";
  const cur = d?.kpis.atual.total;

  // semanas (blocos de 7 dias) a partir da série de 30 dias, da mais recente para trás
  const weeks = (() => {
    if (!d) return [];
    const s = [...d.serie_30d];
    const out: { label: string; spend: number; results: number }[] = [];
    for (let end = s.length; end - 7 >= 0 && out.length < 4; end -= 7) {
      const w = s.slice(end - 7, end);
      const sp = w.reduce((a, x) => a + x.meta_spend + x.google_spend, 0);
      const r = w.reduce((a, x) => a + x.results, 0);
      const f = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
      out.push({ label: `${f(w[0].date)} – ${f(w[w.length - 1].date)}`, spend: sp, results: r });
    }
    return out;
  })();

  return (
    <main className="page">
      <div className="page-head"><h1>Desempenho</h1><p className="sub">Evolução e os criativos que mais trouxeram resultado.</p></div>
      <div className="controls">
        <PeriodPicker query={query} range={d?.periodo.atual ?? null} onChange={setQuery} />
        <ChannelChips value={query.channel} hasGoogle={!!d?.cliente.tem_google} onChange={(c) => setQuery({ ...query, channel: c })} />
      </div>
      {error && <div className="banner">{error}</div>}
      {loading && !d ? <Skeleton h={300} /> : d && cur ? (
        <>
          <section className="grid-kpi" aria-label="Totais do período">
            <div className="kpi"><span className="l">Investido</span><span className="v">{money(cur.spend)}</span></div>
            <div className="kpi"><span className="l">{resultLabel(obj)}</span><span className="v">{num(cur.results)}</span></div>
            <div className="kpi"><span className="l">Por {resultLabel(obj, false)}</span><span className="v">{money(cur.cpr)}</span></div>
            <div className="kpi"><span className="l">Impressões</span><span className="v">{num(cur.impressions)}</span></div>
          </section>

          {query.channel !== "google" && d.ranking_30d.length > 0 && (
            <section className="card" aria-label="Criativos campeões">
              <h2>Criativos campeões · últimos 30 dias</h2>
              {d.ranking_30d.slice(0, 3).map((c, i) => (
                <div key={c.key} className="rank">
                  <div style={{ position: "relative", flex: "none" }}>
                    {c.thumb ? <img src={c.thumb} alt={c.title ?? "Criativo"} loading="lazy" /> : <div className="skeleton" style={{ width: 72, height: 72 }} />}
                    <span className="rank-n" style={{ background: MEDAL[i] }}>{i + 1}º</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                    <strong style={{ fontSize: 13, lineHeight: 1.35 }}>{c.title ?? "Criativo"}</strong>
                    <span className="note"><strong style={{ fontSize: 16, color: "var(--ink)" }}>{num(c.results)}</strong> {resultLabel(obj).toLowerCase()} · {money(c.cpr)} por {resultLabel(obj, false)}</span>
                    <span className="note">{num(c.impressions)} impressões{c.type === "video" ? ` · ${num(c.video_views)} visualizações` : ""}</span>
                  </div>
                </div>
              ))}
            </section>
          )}

          <section className="card" aria-label="Evolução">
            <h2>Evolução dia a dia</h2>
            <div className="chart-legend">
              <span><span className="dot" style={{ background: "var(--orange)", borderRadius: 2 }} />{resultLabel(obj)}</span>
              <span><span style={{ width: 14, height: 2, background: "var(--ink)" }} />Investimento</span>
            </div>
            <SpendChart data={d.serie_30d} highlight={d.periodo.atual} />
          </section>

          {weeks.length > 0 && (
            <section className="card" aria-label="Semana a semana">
              <h2>Semana a semana</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ color: "var(--muted)", fontSize: 11, textAlign: "right" }}>
                    <th scope="col" style={{ textAlign: "left", fontWeight: 500, padding: "6px 0" }}>Semana</th>
                    <th scope="col" style={{ fontWeight: 500 }}>Investido</th>
                    <th scope="col" style={{ fontWeight: 500 }}>{resultLabel(obj)}</th>
                    <th scope="col" style={{ fontWeight: 500 }}>Por {resultLabel(obj, false)}</th>
                  </tr></thead>
                  <tbody style={{ textAlign: "right" }}>
                    {[...weeks].reverse().map((w) => (
                      <tr key={w.label} style={{ borderTop: "1px solid var(--line)" }}>
                        <td style={{ textAlign: "left", padding: "9px 0" }}>{w.label}</td>
                        <td>{money(w.spend)}</td><td>{num(w.results)}</td><td>{money(w.results ? w.spend / w.results : null)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      ) : null}
    </main>
  );
}
