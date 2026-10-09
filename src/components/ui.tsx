import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { fetchPreview, type Balance, type Channel, type Creative, type PeriodKey, type PortalData, type Query } from "../api";
import { dayMonth, money, num, rangeLabel, resultLabel } from "../format";
import { WHATSAPP_302 } from "../config";

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

// ---------------------------------------------------------------- glossário (ⓘ)
export const GLOSSARIO: Record<string, string> = {
  investimento: "Quanto foi gasto em anúncios no período (valor cobrado pela Meta e pelo Google).",
  resultados: "O resultado que a campanha busca para você: leads (cadastros) ou conversas iniciadas no WhatsApp/Direct, conforme o objetivo.",
  custo: "Investimento dividido pelos resultados. Quanto menor, mais eficiente.",
  impressoes: "Quantas vezes seus anúncios apareceram na tela. A mesma pessoa pode ver mais de uma vez.",
  visualizacoes: "Quantas vezes um vídeo seu foi assistido por 3 segundos ou mais.",
  alcance: "Quantas pessoas diferentes viram seus anúncios ao menos uma vez.",
  thruplay: "Visualizações que foram até o fim do vídeo (ou passaram de 15 segundos).",
  saldo: "Valor que ainda está disponível na conta de anúncios pré-paga. Quando acaba, os anúncios param até a próxima recarga.",
};

export function InfoTip({ k, label }: { k: keyof typeof GLOSSARIO; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="infotip">
      <button type="button" className="infotip-btn" aria-label={`O que é ${label}?`} aria-expanded={open} onClick={(e) => { e.stopPropagation(); setOpen(!open); }} onBlur={() => setOpen(false)}>i</button>
      {open && <span role="tooltip" className="infotip-bubble">{GLOSSARIO[k]}</span>}
    </span>
  );
}

export const whatsappLink = (msg: string) => (WHATSAPP_302 ? `https://wa.me/${WHATSAPP_302}?text=${encodeURIComponent(msg)}` : null);

export function TalkTo302({ cliente, children }: { cliente: string | null; children?: ReactNode }) {
  const href = whatsappLink(`Olá, equipe 302! Aqui é ${cliente ?? "um cliente"}, vim pelo portal de resultados.`);
  if (!href) return null;
  return (
    <section className="card talk" aria-label="Falar com a 302">
      <div>
        <h2>{children ?? "Ficou com alguma dúvida sobre os resultados?"}</h2>
        <p className="note">A equipe da 302 responde pelo WhatsApp.</p>
      </div>
      <a className="btn-dark" href={href} target="_blank" rel="noreferrer noopener">Falar com a 302</a>
    </section>
  );
}

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

// ---------------------------------------------------------------- prévia do anúncio (play + legenda)
export function PreviewModal({ token, c, onClose }: { token: string; c: Creative; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let alive = true;
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    fetchPreview(token, c.ad_id).then((u) => alive && setUrl(u)).catch(() => alive && setFailed(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && boxRef.current) {
        // mantém o foco do teclado dentro da janela
        const f = [...boxRef.current.querySelectorAll<HTMLElement>("button, a[href], iframe")];
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { alive = false; document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; opener?.focus?.(); };
  }, [token, c.ad_id, onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" ref={boxRef} role="dialog" aria-modal="true" aria-label={`Anúncio: ${c.title ?? "criativo"}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <strong>{c.title ?? "Anúncio"}</strong>
          <button type="button" ref={closeRef} className="modal-close" aria-label="Fechar" onClick={onClose}>✕</button>
        </div>
        <div className="modal-frame">
          {url ? (
            <iframe src={url} title={`Prévia do anúncio: ${c.title ?? ""}`} allow="autoplay; encrypted-media; fullscreen" referrerPolicy="no-referrer" />
          ) : failed ? (
            <div className="empty">
              Não foi possível carregar a prévia agora.
              {c.link && <p style={{ marginTop: 10 }}><a href={c.link} target="_blank" rel="noreferrer noopener">Ver na Biblioteca de Anúncios ↗</a></p>}
            </div>
          ) : (
            <div className="skeleton" style={{ height: "100%", borderRadius: 0 }} aria-label="Carregando prévia" />
          )}
        </div>
        {c.caption && (
          <div className="modal-caption">
            <strong>Legenda</strong>
            <p>{c.caption}</p>
          </div>
        )}
        <div className="row-between note" style={{ padding: "8px 14px 12px", alignItems: "center", borderTop: "1px solid var(--line)" }}>
          <span>Prévia oficial da Meta, como aparece no Instagram.</span>
          {c.link && <a href={c.link} target="_blank" rel="noreferrer noopener" style={{ whiteSpace: "nowrap" }}>Biblioteca ↗</a>}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- criativo
export function CreativeCard({ c, objetivo, isNew, token }: { c: Creative; objetivo: string; isNew?: boolean; token: string }) {
  const [playing, setPlaying] = useState(false);
  const [showCaption, setShowCaption] = useState(false);
  const rows: [string, string][] = c.goal === "reconhecimento"
    ? [["Visualizações", num(c.video_views)], ["Até o fim", num(c.thruplays)], ["Impressões", num(c.impressions)]]
    : [[resultLabel(objetivo), num(c.results)], [`Por ${resultLabel(objetivo, false)}`, money(c.cpr)], ["Impressões", num(c.impressions)], ["Visualizações", c.type === "video" ? num(c.video_views) : "—"]];
  return (
    <article className="creative">
      <button type="button" className="thumb thumb-btn" onClick={() => setPlaying(true)} aria-label={`${c.type === "video" ? "Assistir" : "Ver"} anúncio: ${c.title ?? "criativo"}`}>
        {c.thumb ? <img src={c.thumb} alt="" loading="lazy" /> : null}
        {isNew && <span className="badge new">Novo</span>}
        <span className="play-overlay" aria-hidden="true">{c.type === "video" ? Icon.play : "Ver"}</span>
      </button>
      <div className="body">
        <h3>{c.title ?? "Criativo"}</h3>
        <span className="meta">{c.goal === "reconhecimento" ? "Reconhecimento" : "Captação"} · desde {dayMonth(c.since)}</span>
        <div className="stats">{rows.map(([k, v]) => <div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div>
        {c.caption && (
          <>
            <button type="button" className="link-btn" aria-expanded={showCaption} onClick={() => setShowCaption(!showCaption)}>
              {showCaption ? "Ocultar legenda" : "Ver legenda"}
            </button>
            {showCaption && <p className="caption">{c.caption}</p>}
          </>
        )}
      </div>
      {playing && <PreviewModal token={token} c={c} onClose={() => setPlaying(false)} />}
    </article>
  );
}

// ---------------------------------------------------------------- saldo
export function BalanceCard({ b, cliente }: { b: Balance; cliente: string | null }) {
  const [howTo, setHowTo] = useState(false);
  const help = whatsappLink(`Olá, equipe 302! Aqui é ${cliente ?? "um cliente"}. Preciso de ajuda com ${b.payment === "prepago" ? "a recarga do saldo" : "o pagamento"} da conta de anúncios.`);
  if (b.payment !== "prepago") {
    return (
      <section className="card balance" aria-label="Pagamento">
        <div className="card-head">
          <h2>Pagamento da conta Meta</h2>
          <span className={`pill${b.pending_payment ? " warn" : ""}`}>{b.pending_payment ? "Pagamento pendente" : "Cartão"}</span>
        </div>
        <span style={{ fontSize: 14 }}>{b.payment_label ?? "Cartão de crédito"}</span>
        {b.pending_payment && <p className="note" style={{ color: "var(--ink)" }}>A Meta sinalizou um pagamento pendente nesta conta. Os anúncios podem parar até a regularização — confira o cartão cadastrado no Gerenciador de Anúncios (Faturamento).</p>}
        {b.pending_payment && help && <a className="btn-dark" style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", textDecoration: "none", color: "var(--paper)" }} href={help} target="_blank" rel="noreferrer noopener">Pedir ajuda à 302</a>}
      </section>
    );
  }
  const low = b.days_left != null && b.days_left <= 5;
  const pct = b.days_left == null ? 0 : Math.min(100, Math.round((b.days_left / 30) * 100));
  return (
    <section className="card balance" aria-label="Saldo">
      <div className="card-head">
        <h2>Saldo da conta Meta <InfoTip k="saldo" label="saldo" /></h2>
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
      <button type="button" className="link-btn no-print" aria-expanded={howTo} onClick={() => setHowTo(!howTo)}>{howTo ? "Ocultar" : "Como recarregar"}</button>
      {howTo && (
        <ol className="howto">
          <li>Abra o <strong>Gerenciador de Anúncios</strong> da Meta (ou o app Meta Business).</li>
          <li>Vá em <strong>Faturamento e pagamentos</strong> e toque em <strong>Adicionar fundos</strong>.</li>
          <li>Escolha <strong>Pix</strong>, informe o valor e pague o código gerado. O saldo entra em poucos minutos.</li>
          {help ? <li>Se preferir, <a href={help} target="_blank" rel="noreferrer noopener">fale com a 302</a> que a gente te orienta.</li> : <li>Se tiver dúvida, a equipe da 302 te orienta.</li>}
        </ol>
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
