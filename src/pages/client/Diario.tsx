import { useState } from "react";
import { Skeleton } from "../../components/ui";
import { dayMonth } from "../../format";
import { useClient } from "./ClientLayout";

type F = "tudo" | "meta" | "google" | "pagamento";
const TAG: Record<string, string> = { meta: "Meta", google: "Google", pagamento: "Pagamento" };

export default function Diario() {
  const { data, loading, error } = useClient();
  const [f, setF] = useState<F>("tudo");
  const items = (data?.diario ?? []).filter((e) => f === "tudo" || e.platform === f);
  const has = (p: string) => (data?.diario ?? []).some((e) => e.platform === p);

  return (
    <main className="page" style={{ maxWidth: 760 }}>
      <div className="page-head"><h1>Diário da gestão</h1><p className="sub">O que a equipe 302 fez nas suas campanhas.</p></div>
      <div className="chips" role="group" aria-label="Filtro">
        {(["tudo", "meta", "google", "pagamento"] as F[]).filter((k) => k === "tudo" || has(k)).map((k) => (
          <button key={k} type="button" className="chip" aria-pressed={f === k} onClick={() => setF(k)}>{k === "tudo" ? "Tudo" : TAG[k]}</button>
        ))}
      </div>
      {error && <div className="banner">{error}</div>}
      {loading && !data ? <Skeleton h={300} /> : items.length ? (
        <ol className="timeline">
          {items.map((e) => (
            <li key={e.id}>
              <div className="tl-date">{dayMonth(new Date(new Date(e.at).getTime() - 3 * 3600_000).toISOString())}</div>
              <article className={`card tl-card ${e.platform}`}>
                <span className={`tag ${e.platform}`}>{TAG[e.platform] ?? e.platform}</span>
                <h3>{e.title}</h3>
                {e.thumbs.length > 0 && (
                  <div className="thumbs-3" style={{ maxWidth: 260 }}>
                    {e.thumbs.map((t) => <img key={t} src={t} alt="" loading="lazy" style={{ borderRadius: 8 }} />)}
                  </div>
                )}
                {e.detail && <p>{e.detail}</p>}
              </article>
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty">Ainda não há registros no diário. As próximas ações da equipe aparecem aqui.</p>
      )}
    </main>
  );
}
