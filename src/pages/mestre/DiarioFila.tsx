import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../supabase";
import { dayMonth } from "../../format";
import { useMestre } from "./MestreLayout";

type Entry = { id: string; cliente_id: string; happened_at: string; platform: string; kind: string; title: string; detail: string | null; nome: string };

export default function DiarioFila() {
  const { session, toast } = useMestre();
  const [sp, setSp] = useSearchParams();
  const filtro = sp.get("c");
  const [items, setItems] = useState<Entry[] | null>(null);
  const [edits, setEdits] = useState<Record<string, { title: string; detail: string }>>({});

  const load = useCallback(async () => {
    let q = supabase.from("portal_diary_entries")
      .select("id, cliente_id, happened_at, platform, kind, title, detail, clientes(nome_fantasia)")
      .eq("status", "draft").order("happened_at", { ascending: false }).limit(300);
    if (filtro) q = q.eq("cliente_id", filtro);
    const { data, error } = await q;
    if (error) { toast(`Erro: ${error.message}`); return; }
    setItems((data ?? []).map((e) => ({ ...e, nome: (e.clientes as unknown as { nome_fantasia: string } | null)?.nome_fantasia ?? "—" })));
    setEdits({});
  }, [filtro, toast]);
  useEffect(() => { load(); }, [load]);

  const val = (e: Entry) => edits[e.id] ?? { title: e.title, detail: e.detail ?? "" };
  const setVal = (e: Entry, patch: Partial<{ title: string; detail: string }>) => setEdits((s) => ({ ...s, [e.id]: { ...val(e), ...patch } }));

  const decide = async (ids: string[], status: "approved" | "discarded") => {
    for (const id of ids) {
      const e = items!.find((x) => x.id === id)!;
      const v = val(e);
      const { error } = await supabase.from("portal_diary_entries").update(
        status === "approved"
          ? { status, title: v.title.trim() || e.title, detail: v.detail.trim() || null, approved_by: session.user.id, approved_at: new Date().toISOString() }
          : { status },
      ).eq("id", id);
      if (error) { toast(`Erro: ${error.message}`); return; }
    }
    toast(status === "approved" ? `${ids.length} item(ns) publicado(s) para o cliente` : `${ids.length} item(ns) descartado(s)`);
    load();
  };

  const clientes = [...new Map((items ?? []).map((e) => [e.cliente_id, e.nome])).entries()];

  return (
    <main className="page" style={{ maxWidth: 900 }}>
      <div className="page-head">
        <h1>Diário · para revisar</h1>
        <p className="sub">Rascunhos gerados do registro de atividades das contas. Só o que você aprovar aparece para o cliente.</p>
      </div>
      <div className="chips">
        {filtro && <button type="button" className="chip" aria-pressed="true" onClick={() => setSp({})}>Mostrar todos os clientes ✕</button>}
        {!filtro && clientes.map(([id, n]) => <button key={id} type="button" className="chip" onClick={() => setSp({ c: id })}>{n}</button>)}
      </div>
      {items && items.length > 0 && filtro && (
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn-dark" onClick={() => decide(items.map((e) => e.id), "approved")}>Aprovar todos ({items.length})</button>
        </div>
      )}
      {items === null ? <p className="sub">Carregando…</p> : items.length === 0 ? <p className="empty">Nada para revisar.</p> : items.map((e) => (
        <article key={e.id} className="card">
          <div className="note"><strong style={{ color: "var(--ink)" }}>{e.nome}</strong> · {dayMonth(new Date(new Date(e.happened_at).getTime() - 3 * 3600_000).toISOString())} · {e.platform}</div>
          <label className="field">Texto para o cliente<input value={val(e).title} onChange={(x) => setVal(e, { title: x.target.value })} /></label>
          <label className="field">Detalhe (opcional)<textarea rows={2} value={val(e).detail} onChange={(x) => setVal(e, { detail: x.target.value })} /></label>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn-dark" style={{ flex: 1 }} onClick={() => decide([e.id], "approved")}>Aprovar e publicar</button>
            <button type="button" className="btn-line" onClick={() => decide([e.id], "discarded")}>Descartar</button>
          </div>
        </article>
      ))}
    </main>
  );
}
