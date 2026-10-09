import { useState } from "react";
import { CreativeCard, PeriodPicker, Skeleton } from "../../components/ui";
import { ManagerStrip } from "../../components/google";
import { rangeLabel } from "../../format";
import { useClient } from "./ClientLayout";

type Filter = "todos" | "resultado" | "reconhecimento";

export default function Criativos() {
  const { data, loading, error, query, setQuery, token } = useClient();
  const [filter, setFilter] = useState<Filter>("todos");
  const all = data?.criativos_ativos ?? [];
  const list = filter === "todos" ? all : all.filter((c) => c.goal === filter);
  const hasReach = all.some((c) => c.goal === "reconhecimento");
  const recent = (since: string | null) => !!since && Date.now() - new Date(since).getTime() < 10 * 86400_000;

  return (
    <main className="page">
      <div className="page-head">
        <h1><span className="live-dot" aria-hidden="true" />Criativos ativos</h1>
        <p className="sub">
          {data ? `${all.length} ${all.length === 1 ? "criativo rodando" : "criativos rodando"} agora no Instagram e Facebook. Números de ${rangeLabel(data.periodo.atual.since, data.periodo.atual.until)}.` : "Carregando…"}
        </p>
      </div>
      <div className="controls">
        <PeriodPicker query={query} range={data?.periodo.atual ?? null} onChange={setQuery} />
        {hasReach && (
          <div className="chips" role="group" aria-label="Tipo de campanha">
            {([["todos", "Todos"], ["resultado", "Captação"], ["reconhecimento", "Reconhecimento"]] as [Filter, string][]).map(([k, l]) => (
              <button key={k} type="button" className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
        )}
      </div>
      {error && <div className="banner">{error}</div>}
      {data && <ManagerStrip refs={data.gerenciador ?? []} criativos={all.length} />}
      {loading && !data ? (
        <div className="creative-grid">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} h={300} />)}</div>
      ) : list.length ? (
        <div className="creative-grid" style={{ opacity: loading ? 0.6 : 1 }}>
          {list.map((c) => <CreativeCard key={c.key} c={c} objetivo={data!.cliente.objetivo} isNew={recent(c.since)} token={token} />)}
        </div>
      ) : (
        <p className="empty">Nenhum criativo ativo neste momento.</p>
      )}
      <p className="note">Toque no criativo para assistir ao anúncio como ele aparece no Instagram.</p>
    </main>
  );
}
