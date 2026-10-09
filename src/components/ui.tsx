import { useEffect, useMemo, useState } from "react";
import type { Balance, Channel, Creative, PeriodKey, PortalData, Query } from "../api";
import { dayMonth, money, num, rangeLabel, resultLabel } from "../format";

// ---------------------------------------------------------------- ícones
const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
export const Icon = {
  home: <svg width="22" height="22" viewBox="0 0 24 24" {...S} aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>,
  grid: <svg width="22" height="22" viewBox="0 0 24 24" {...S} aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
  chart: <svg width="22" height="22" viewBox="0 0 24 24" {...S} aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>,
  diary: <svg width="22" height="22" viewBox="0 0 24 24" {...S} aria-hidden="true"><path d="M6 3h11a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 1-2z" /><path d="M9 8h7M9 12h7" /></svg>,
  cal: <svg width="20" height="20" viewBox="0 0 24 24" {...S} aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>,
  down: <svg width="18" height="18" viewBox="0 0 24 24" {...S} strokeWidth={2} aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>,
  play: <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8z" /></svg>,
};

// ---------------------------------------------------------------- período
const todayBRT = () => {
  const t = new Date(Date.now() - 3 * 3600_000);
  return t.toISOString().slice(0, 10);
};
const PERIODS: { key: Exclude<PeriodKey, "custom">; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "7d", label: "Últimos 7 dias" },
  { key: "30d", label: "Últimos 30 dias" },
  { key: "mes", label: "Este mês" },
];
export const periodLabel = (k: PeriodKey) => PERIODS.find((p) => p.key === k)?.label ?? "Personalizado";

export function PeriodPicker({ query, range, onChange }: { query: Query; range: { since: string; until: string } | null; onChange: (q: Query) => void }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(query.period === "custom");
  const today = todayBRT();
  const [since, setSince] = useState(query.since ?? range?.since ?? today);
  const [until, setUntil] = useState(query.until ?? range?.until ?? today);
  const valid = since <= until && until <= today;

  return (
    <div className="period-wrap">
      <button type="button" className="period-btn" aria-expanded={open} onClick={() => setOpen(!open)}>
        {Icon.cal}
        <span style={{ flex: 1 }}>
          <strong>{periodLabel(query.period)}</strong>
          <span className="r">{range ? rangeLabel(range.since, range.until) : "…"}</span>
        </span>
        {Icon.down}
      </button>
      {open && (
        <div className="period-pop" role="dialog" aria-label="Escolher período">
          {PERIODS.map((p) => (
            <button key={p.key} type="button" className="period-opt" aria-pressed={!custom && query.period === p.key}
              onClick={() => { setCustom(false); setOpen(false); onChange({ ...query, period: p.key, since: undefined, until: undefined }); }}>
              {p.label}
            </button>
          ))}
          <button type="button" className="period-opt" aria-pressed={custom} onClick={() => setCustom(true)}>
            Personalizado <span>escolha as datas</span>
          </button>
          {custom && (
            <>
              <div className="custom-dates">
                <label>De<input type="date" value={since} max={today} onChange={(e) => setSince(e.target.value)} /></label>
                <label>Até<input type="date" value={until} max={today} onChange={(e) => setUntil(e.target.value)} /></label>
              </div>
              <div style={{ padding: "4px 8px 8px" }}>
                <button type="button" className="btn-dark" style={{ width: "100%" }} disabled={!valid}
                  onClick={() => { setOpen(false); onChange({ ...query, period: "custom", since, until }); }}>
                  Aplicar período
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ChannelChips({ value, hasGoogle, onChange }: { value: Channel; hasGoogle: boolean; onChange: (c: Channel) => void }) {
  if (!hasGoogle) return null;
  const opts: { k: Channel; l: string }[] = [{ k: "all", l: "Todos" }, { k: "meta", l: "Meta" }, { k: "google", l: "Google" }];
  return (
    <div className="chips" role="group" aria-label="Canal">
      {opts.map((o) => (
        <button key={o.k} type="button" className="chip" aria-pressed={value === o.k} onClick={() => onChange(o.k)}>{o.l}</button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- gráfico (barras = resultados, linha = investimento)
export function SpendChart({ data, highlight }: { data: PortalData["serie_30d"]; highlight?: { since: string; until: string } }) {
  const W = 560, H = 150;
  const n = data.length || 1;
  const maxR = Math.max(1, ...data.map((d) => d.results));
  const maxS = Math.max(1, ...data.map((d) => d.meta_spend + d.google_spend));
  const bw = W / n;
  const pts = data.map((d, i) => `${(i * bw + bw / 2).toFixed(1)},${(H - ((d.meta_spend + d.google_spend) / maxS) * (H - 8)).toFixed(1)}`).join(" ");
  const inHi = (date: string) => !!highlight && date >= highlight.since && date <= highlight.until;
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Resultados por dia e investimento, ${dayMonth(data[0]?.date)} a ${dayMonth(data[n - 1]?.date)}`}>
        <line x1="0" y1={H - 0.5} x2={W} y2={H - 0.5} stroke="var(--line)" />
        {data.map((d, i) => {
          const h = (d.results / maxR) * (H - 8);
          return <rect key={d.date} x={i * bw + bw * 0.18} y={H - h} width={bw * 0.64} height={h} rx="1.5" fill={inHi(d.date) ? "var(--orange)" : "var(--tan)"}>
            <title>{`${dayMonth(d.date)}: ${d.results} resultado(s), ${money(d.meta_spend + d.google_spend)}`}</title>
          </rect>;
        })}
        <polyline fill="none" stroke="var(--ink)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" points={pts} />
      </svg>
      <div className="axis"><span>{dayMonth(data[0]?.date)}</span><span>{dayMonth(data[Math.floor(n / 2)]?.date)}</span><span>{dayMonth(data[n - 1]?.date)}</span></div>
    </div>
  );
}

// ---------------------------------------------------------------- criativo
export function CreativeCard({ c, objetivo, isNew }: { c: Creative; objetivo: string; isNew?: boolean }) {
  const rows: [string, string][] = c.goal === "reconhecimento"
    ? [["Visualizações", num(c.video_views)], ["Até o fim", num(c.thruplays)], ["Impressões", num(c.impressions)]]
    : [[resultLabel(objetivo), num(c.results)], [`Por ${resultLabel(objetivo, false)}`, money(c.cpr)], ["Impressões", num(c.impressions)], ["Visualizações", c.type === "video" ? num(c.video_views) : "—"]];
  return (
    <article className="creative">
      <div className="thumb">
        {c.thumb ? <img src={c.thumb} alt={c.title ?? "Criativo"} loading="lazy" /> : null}
        {isNew && <span className="badge new">Novo</span>}
        {c.type === "video" && <span className="badge type">{Icon.play} Vídeo</span>}
      </div>
      <div className="body">
        <h3>{c.title ?? "Criativo"}</h3>
        <span className="meta">{c.goal === "reconhecimento" ? "Reconhecimento" : "Captação"} · desde {dayMonth(c.since)}</span>
        <div className="stats">{rows.map(([k, v]) => <div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div>
        {c.link && <a className="see" href={c.link} target="_blank" rel="noreferrer noopener">Ver anúncio ↗</a>}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------- saldo
export function BalanceCard({ b }: { b: Balance }) {
  if (b.payment !== "prepago") {
    return (
      <section className="card balance" aria-label="Pagamento">
        <div className="card-head">
          <h2>Pagamento da conta Meta</h2>
          <span className={`pill${b.pending_payment ? " warn" : ""}`}>{b.pending_payment ? "Pagamento pendente" : "Cartão"}</span>
        </div>
        <span style={{ fontSize: 14 }}>{b.payment_label ?? "Cartão de crédito"}</span>
        {b.pending_payment && <p className="note" style={{ color: "var(--ink)" }}>A Meta sinalizou um pagamento pendente nesta conta. Os anúncios podem parar até a regularização.</p>}
      </section>
    );
  }
  const low = b.days_left != null && b.days_left <= 5;
  const pct = b.days_left == null ? 0 : Math.min(100, Math.round((b.days_left / 30) * 100));
  return (
    <section className="card balance" aria-label="Saldo">
      <div className="card-head">
        <h2>Saldo da conta Meta</h2>
        <span className={`pill${low ? " warn" : ""}`}>{low ? "Saldo baixo" : "Pix · pré-pago"}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span className="big">{money(b.balance)}</span><span className="sub" style={{ color: "var(--muted-2)" }}>disponível</span>
      </div>
      {b.days_left != null && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="meter" aria-hidden="true"><div style={{ width: `${pct}%` }} /></div>
          <span style={{ fontSize: 13 }}>
            {b.days_left === 0 ? <>Saldo esgotado — <strong>os anúncios param</strong> até a próxima recarga</>
              : <>Dura cerca de <strong>{b.days_left} {b.days_left === 1 ? "dia" : "dias"}</strong> no ritmo atual ({money(b.spend_per_day)}/dia)</>}
          </span>
        </div>
      )}
      {b.last_recharge && (
        <div className="row-between" style={{ paddingTop: 10, borderTop: "1px solid rgba(32,33,35,0.12)" }}>
          <span style={{ color: "var(--muted-2)" }}>Última recarga</span>
          <strong>{dayMonth(b.last_recharge.at.slice(0, 10))} · {money(b.last_recharge.amount)}</strong>
        </div>
      )}
    </section>
  );
}

export function Skeleton({ h = 120 }: { h?: number }) {
  return <div className="skeleton" style={{ height: h }} aria-hidden="true" />;
}

export function useIsDesktop() {
  const q = useMemo(() => window.matchMedia("(min-width: 900px)"), []);
  const [v, setV] = useState(q.matches);
  useEffect(() => { const f = () => setV(q.matches); q.addEventListener("change", f); return () => q.removeEventListener("change", f); }, [q]);
  return v;
}
