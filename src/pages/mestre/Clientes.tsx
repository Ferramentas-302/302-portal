import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabase";
import { ago, money } from "../../format";
import { useMestre } from "./MestreLayout";

type Row = {
  cliente_id: string; token: string; enabled: boolean; last_seen_at: string | null; views_count: number;
  nome: string; status: string;
  configurado: boolean; canais: string; objetivo: string | null;
  saldo: { prepago: boolean; bruto: number | null; pendente: boolean } | null;
  rascunhos: number;
};

export default function Clientes() {
  const { toast } = useMestre();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [todos, setTodos] = useState(false);

  const load = useCallback(async () => {
    const [acc, cfg, bil, dr] = await Promise.all([
      supabase.from("portal_access").select("cliente_id, token, enabled, last_seen_at, views_count, clientes(nome_fantasia, status)"),
      supabase.from("perf_client_config").select("cliente_id, meta_account_ids, google_customer_ids, primary_objective, ativo"),
      supabase.from("perf_billing_snapshot").select("cliente_id, is_prepay, balance_gross, account_status"),
      supabase.from("portal_diary_entries").select("cliente_id").eq("status", "draft"),
    ]);
    if (acc.error) { setErr(acc.error.message); return; }
    const cfgBy = new Map((cfg.data ?? []).map((c) => [c.cliente_id, c]));
    const draftBy = new Map<string, number>();
    for (const d of dr.data ?? []) draftBy.set(d.cliente_id, (draftBy.get(d.cliente_id) ?? 0) + 1);
    const out: Row[] = (acc.data ?? []).map((a) => {
      const c = cfgBy.get(a.cliente_id);
      const b = (bil.data ?? []).find((x) => x.cliente_id === a.cliente_id);
      const cli = a.clientes as unknown as { nome_fantasia: string; status: string } | null;
      const meta = (c?.meta_account_ids ?? []).length, google = (c?.google_customer_ids ?? []).length;
      return {
        cliente_id: a.cliente_id, token: a.token, enabled: a.enabled, last_seen_at: a.last_seen_at, views_count: a.views_count,
        nome: cli?.nome_fantasia ?? "—", status: cli?.status ?? "",
        configurado: !!c?.ativo && meta + google > 0,
        canais: [meta ? "Meta" : "", google ? "Google" : ""].filter(Boolean).join(" + ") || "—",
        objetivo: c?.primary_objective ?? null,
        saldo: b ? { prepago: !!b.is_prepay, bruto: b.balance_gross, pendente: b.account_status === 9 || b.account_status === 3 } : null,
        rascunhos: draftBy.get(a.cliente_id) ?? 0,
      };
    });
    out.sort((x, y) => Number(y.configurado) - Number(x.configurado) || x.nome.localeCompare(y.nome, "pt-BR"));
    setRows(out);
  }, []);
  useEffect(() => { load(); }, [load]);

  const link = (t: string) => `${window.location.origin}/c/${t}`;
  const copy = async (r: Row) => { await navigator.clipboard.writeText(link(r.token)); toast(`Link de ${r.nome} copiado`); };
  const toggle = async (r: Row) => {
    const { error } = await supabase.from("portal_access").update({ enabled: !r.enabled }).eq("cliente_id", r.cliente_id);
    if (error) toast(`Erro: ${error.message}`); else { toast(!r.enabled ? `Portal de ${r.nome} ligado` : `Portal de ${r.nome} desligado`); load(); }
  };
  const rotate = async (r: Row) => {
    if (!window.confirm(`Gerar um link novo para ${r.nome}? O link atual deixa de funcionar na hora.`)) return;
    const { error } = await supabase.rpc("portal_rotate_token", { _cliente_id: r.cliente_id });
    if (error) toast(`Erro: ${error.message}`); else { toast("Link novo gerado"); load(); }
  };

  const visible = (rows ?? []).filter((r) => todos || (r.configurado && r.status === "ativo"));
  const avisos = (rows ?? []).filter((r) => r.configurado && r.saldo && (r.saldo.pendente || (r.saldo.prepago && (r.saldo.bruto ?? 0) <= 50)));
  const totalDrafts = (rows ?? []).reduce((a, r) => a + r.rascunhos, 0);

  return (
    <main className="page">
      <div className="page-head">
        <h1>Clientes</h1>
        <p className="sub">{rows ? `${visible.filter((r) => r.enabled).length} portais ligados · ${totalDrafts} rascunhos do diário para revisar` : "Carregando…"}</p>
      </div>
      {err && <div className="banner">{err}</div>}
      {avisos.length > 0 && (
        <section className="card" aria-label="Avisos">
          <h2>Avisos</h2>
          {avisos.map((r) => (
            <p key={r.cliente_id} style={{ fontSize: 13 }}>
              <strong>{r.nome}:</strong> {r.saldo!.pendente ? "pagamento pendente na conta Meta." : `saldo pré-pago em ${money(r.saldo!.bruto)} — anúncios parados ou prestes a parar.`}
            </p>
          ))}
        </section>
      )}
      <div className="table-wrap">
        <table className="m">
          <thead><tr><th scope="col">Cliente</th><th scope="col">Canais</th><th scope="col">Pagamento</th><th scope="col">Portal</th><th scope="col">Último acesso</th><th scope="col">Diário</th><th scope="col" style={{ textAlign: "right" }}>Ações</th></tr></thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.cliente_id} style={{ opacity: r.configurado ? 1 : 0.55 }}>
                <td><strong>{r.nome}</strong><div className="note">{r.configurado ? (r.objetivo === "messages" ? "mensagens" : r.objetivo ?? "") : "sem contas configuradas"}</div></td>
                <td>{r.canais}</td>
                <td>{r.saldo ? (r.saldo.pendente ? <span className="pill warn" style={{ background: "var(--cream)" }}>Pendente</span> : r.saldo.prepago ? `Pix · ${money(r.saldo.bruto)}` : "Cartão") : "—"}</td>
                <td>
                  <label className="switch"><input type="checkbox" checked={r.enabled} onChange={() => toggle(r)} disabled={!r.configurado} />{r.enabled ? "Ligado" : "Desligado"}</label>
                </td>
                <td className="note">{r.last_seen_at ? `${ago(r.last_seen_at)} · ${r.views_count}×` : "nunca abriu"}</td>
                <td>{r.rascunhos ? <Link to={`/mestre/diario?c=${r.cliente_id}`}>{r.rascunhos} rascunho(s)</Link> : <span className="note">—</span>}</td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <div style={{ display: "inline-flex", gap: 6 }}>
                    <a className="btn-dark" style={{ display: "inline-flex", alignItems: "center", minHeight: 34, fontSize: 12, textDecoration: "none", color: "var(--paper)" }} href={`/c/${r.token}`} target="_blank" rel="noreferrer">Abrir portal</a>
                    <button type="button" className="btn-line" style={{ minHeight: 34, fontSize: 12 }} onClick={() => copy(r)}>Copiar link</button>
                    <button type="button" className="btn-line" style={{ minHeight: 34, fontSize: 12 }} onClick={() => rotate(r)}>Gerar novo</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <label className="switch" style={{ fontSize: 13 }}><input type="checkbox" checked={todos} onChange={(e) => setTodos(e.target.checked)} />Mostrar também clientes inativos ou sem contas configuradas</label>
      <p className="note">Portal desligado: o link do cliente mostra “link indisponível”. Você continua conseguindo abrir (prévia do mestre) enquanto estiver logado.</p>
    </main>
  );
}
