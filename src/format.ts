const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const int = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export const money = (n: number | null | undefined) => (n == null ? "—" : brl.format(n));
export const num = (n: number | null | undefined) => (n == null ? "—" : int.format(n));

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// "2026-10-07" → "07/out"
export function dayMonth(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${MESES[Number(m) - 1]}`;
}

// intervalo "01 a 07 out" / "08 set a 07 out"
export function rangeLabel(since: string, until: string): string {
  const [, ms, ds] = since.split("-");
  const [, mu, du] = until.split("-");
  if (since === until) return `${du} ${MESES[Number(mu) - 1]}`;
  return ms === mu ? `${ds} a ${du} ${MESES[Number(mu) - 1]}` : `${ds} ${MESES[Number(ms) - 1]} a ${du} ${MESES[Number(mu) - 1]}`;
}

// "08/out, às 22h27" (horário de Brasília)
export function stamp(isoTs: string | null | undefined): string {
  if (!isoTs) return "—";
  const d = new Date(isoTs);
  const p = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${get("day")}/${MESES[Number(get("month")) - 1]}, às ${get("hour")}h${get("minute")}`;
}

export function ago(isoTs: string | null | undefined): string {
  if (!isoTs) return "";
  const min = Math.round((Date.now() - new Date(isoTs).getTime()) / 60000);
  if (min < 2) return "agora há pouco";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `há ${h}h` : `há ${Math.round(h / 24)} dia(s)`;
}

// variação % (neutra: o portal não pinta de verde/vermelho)
export function delta(cur: number | null, prev: number | null): string | null {
  if (cur == null || prev == null || prev === 0) return null;
  const p = Math.round(((cur - prev) / prev) * 100);
  if (p === 0) return "= igual ao período anterior";
  return `${p > 0 ? "↑" : "↓"} ${Math.abs(p)}%`;
}

export const resultLabel = (objetivo: string, plural = true) =>
  objetivo === "messages" ? (plural ? "Conversas" : "conversa")
    : objetivo === "purchases" ? (plural ? "Compras" : "compra")
    : objetivo === "calls" ? (plural ? "Ligações" : "ligação")
    : objetivo === "traffic" ? (plural ? "Cliques" : "clique")
    : plural ? "Leads" : "lead";
