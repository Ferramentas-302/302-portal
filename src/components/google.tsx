import type { Auction, Keyword, ManagerRef } from "../api";
import { ago, money, num, stamp } from "../format";
import { InfoTip } from "./ui";

const pctTxt = (v: number | null) => (v == null ? "—" : v < 10 && v > 0 ? `${v.toLocaleString("pt-BR")}%` : `${Math.round(v)}%`);
const MATCH: Record<string, string> = { BROAD: "ampla", PHRASE: "frase", EXACT: "exata" };

// ---------------------------------------------------------------- leilão do Google (da própria conta)
export function AuctionCard({ a }: { a: Auction }) {
  const lost = (a.perdida_orcamento ?? 0) + (a.perdida_classificacao ?? 0);
  return (
    <section className="card" aria-label="Leilão do Google">
      <h2>Google · presença nas buscas <InfoTip k="parcela" label="parcela de impressões" /></h2>
      <div className="auction-hero">
        <div>
          <span className="auction-big">{pctTxt(a.parcela)}</span>
          <span className="note">das buscas em que seu anúncio podia aparecer, ele apareceu</span>
        </div>
      </div>
      <div className="auction-bar" role="img" aria-label={`Apareceu em ${pctTxt(a.parcela)}; perdeu ${pctTxt(a.perdida_orcamento)} por orçamento e ${pctTxt(a.perdida_classificacao)} por classificação`}>
        <div style={{ width: `${a.parcela ?? 0}%`, background: "var(--orange)" }} />
        <div style={{ width: `${a.perdida_orcamento ?? 0}%`, background: "var(--tan)" }} />
        <div style={{ width: `${a.perdida_classificacao ?? 0}%`, background: "var(--ink)" }} />
      </div>
      <div className="chart-legend">
        <span><span className="dot" style={{ background: "var(--orange)" }} />Apareceu {pctTxt(a.parcela)}</span>
        <span><span className="dot" style={{ background: "var(--tan)" }} />Limite de orçamento {pctTxt(a.perdida_orcamento)} <InfoTip k="perdida_orcamento" label="perdida por orçamento" /></span>
        <span><span className="dot" style={{ background: "var(--ink)" }} />Classificação {pctTxt(a.perdida_classificacao)} <InfoTip k="perdida_classificacao" label="perdida por classificação" /></span>
      </div>
      <div className="mini-grid" style={{ paddingLeft: 0 }}>
        <div>No topo da página<strong>{pctTxt(a.topo)}</strong></div>
        <div>Em 1º lugar<strong>{pctTxt(a.primeiro)}</strong></div>
        <div>Buscas possíveis<strong>{num(a.buscas_elegiveis)}</strong></div>
      </div>
      {lost >= 20 && (
        <p className="note" style={{ color: "var(--ink)" }}>
          {(a.perdida_orcamento ?? 0) >= (a.perdida_classificacao ?? 0)
            ? `A maior parte das buscas que ficaram de fora (${pctTxt(a.perdida_orcamento)}) foi por limite de orçamento — há espaço para crescer com mais verba.`
            : `A maior parte das buscas que ficaram de fora (${pctTxt(a.perdida_classificacao)}) foi por classificação do anúncio — a 302 trabalha lances e qualidade para ganhar mais posições.`}
        </p>
      )}
      {a.campanhas.length > 1 && (
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead><tr><th scope="col">Campanha</th><th scope="col">Apareceu</th><th scope="col">1º lugar</th><th scope="col">Perdida orçam.</th><th scope="col">Perdida classif.</th></tr></thead>
            <tbody>
              {a.campanhas.map((c) => (
                <tr key={c.nome}><td>{(c.nome ?? "—").replace(/^302_/, "").replace(/_/g, " ").toLowerCase()}</td><td>{pctTxt(c.parcela)}</td><td>{pctTxt(c.primeiro)}</td><td>{pctTxt(c.perdida_orcamento)}</td><td>{pctTxt(c.perdida_classificacao)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- palavras-chave
export function KeywordsCard({ list }: { list: Keyword[] }) {
  if (!list.length) return null;
  return (
    <section className="card" aria-label="Palavras-chave do Google">
      <h2>Google · palavras-chave com mais cliques</h2>
      <p className="note">“Em 1º” = das vezes que o anúncio apareceu, quantas foi o primeiro da página <InfoTip k="em_primeiro" label="em 1º" /></p>
      <ol className="kw-list">
        {list.map((k) => (
          <li key={`${k.texto}|${k.correspondencia}`}>
            <div className="row-between" style={{ alignItems: "baseline" }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{k.texto} <span className="note">· {MATCH[k.correspondencia ?? ""] ?? "—"}</span></span>
              <span style={{ whiteSpace: "nowrap", fontSize: 13 }}><strong>{num(k.cliques)}</strong> <span className="note">cliques</span></span>
            </div>
            <div className="kw-meter" aria-hidden="true"><div style={{ width: `${k.em_primeiro ?? 0}%` }} /></div>
            <div className="note">
              {num(k.impressoes)} impressões · CTR {pctTxt(k.ctr)} · CPC {money(k.cpc)} · {pctTxt(k.em_primeiro)} em 1º
              {k.parcela_buscas != null ? ` · apareceu em ${pctTxt(k.parcela_buscas)} das buscas` : ""}
              {k.conversoes ? ` · ${num(k.conversoes)} conversões` : ""}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ---------------------------------------------------------------- referência do Gerenciador / Biblioteca
export function ManagerStrip({ refs, criativos }: { refs: ManagerRef[]; criativos: number }) {
  if (!refs.length) return null;
  const ativos = refs.reduce((a, r) => a + r.anuncios_ativos, 0);
  const analise = refs.reduce((a, r) => a + r.em_analise, 0);
  const quando = refs.map((r) => r.atualizado_em).sort()[0];
  const lib = refs.find((r) => r.biblioteca_url)?.biblioteca_url;
  return (
    <div className="manager-strip">
      <span>
        <strong>{num(ativos)} {ativos === 1 ? "anúncio ativo" : "anúncios ativos"}</strong> no Gerenciador da Meta
        {ativos !== criativos ? `, agrupados em ${criativos} ${criativos === 1 ? "criativo" : "criativos"} (o mesmo anúncio — mesmo vídeo ou imagem e mesmo texto — rodando em públicos diferentes conta uma vez)` : ""}.
        {analise > 0 ? ` ${analise} em análise, entrando no ar.` : ""} Conferido {ago(quando)} ({stamp(quando)}).
      </span>
      {lib && <a href={lib} target="_blank" rel="noreferrer noopener">Ver na Biblioteca de Anúncios ↗</a>}
    </div>
  );
}
