import { PORTAL_API } from "./config";
import { supabase } from "./supabase";

export type PeriodKey = "hoje" | "7d" | "30d" | "mes" | "custom";
export type Channel = "all" | "meta" | "google";

export type Kpi = {
  spend: number;
  results: number;
  cpr: number | null;
  impressions: number;
  clicks: number;
  video_views: number;
  thruplays: number;
};

export type KpiSet = { total: Kpi; meta: Kpi; google: Kpi };

export type Creative = Kpi & {
  key: string;
  title: string | null;
  type: "video" | "image";
  thumb: string | null;
  since: string | null;
  goal: "resultado" | "reconhecimento";
  link: string | null;
};

export type Balance = {
  platform: string;
  payment: "prepago" | "cartao" | "outro";
  payment_label: string | null;
  balance: number | null;
  days_left: number | null;
  spend_per_day: number;
  pending_payment: boolean;
  last_recharge: { at: string; amount: number; method: string | null } | null;
  updated_at: string;
};

export type DiaryItem = {
  id: string;
  at: string;
  platform: "meta" | "google" | "pagamento";
  kind: string;
  title: string;
  detail: string | null;
  thumbs: string[];
};

export type PortalData = {
  version: string;
  preview: boolean;
  cliente: { nome: string | null; objetivo: string; tem_google: boolean };
  periodo: { key: PeriodKey; atual: { since: string; until: string }; anterior: { since: string; until: string }; canal: Channel };
  atualizado_em: string | null;
  kpis: { atual: KpiSet; anterior: KpiSet; alcance: { atual: number | null; anterior: number | null } };
  serie_30d: { date: string; meta_spend: number; google_spend: number; results: number }[];
  criativos_ativos: Creative[];
  ranking_30d: Creative[];
  palavras_chave: unknown[];
  saldo: Balance[];
  diario: DiaryItem[];
};

export type Query = { period: PeriodKey; channel: Channel; since?: string; until?: string };

export class NotFoundError extends Error {}

export async function fetchPortal(token: string, q: Query, signal?: AbortSignal): Promise<PortalData> {
  const params = new URLSearchParams({ t: token, period: q.period, channel: q.channel });
  if (q.period === "custom" && q.since && q.until) {
    params.set("since", q.since);
    params.set("until", q.until);
  }
  // Se o mestre estiver logado, manda o JWT: permite a prévia de portal ainda desligado.
  const headers: Record<string, string> = {};
  const { data } = await supabase.auth.getSession();
  if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;

  // Só no `npm run dev` local: /c/qa-<cliente_id> usa o modo de verificação da portal-api.
  // VITE_QA_SECRET vive em .env.local (fora do git) e não existe no build de produção.
  if (import.meta.env.DEV && import.meta.env.VITE_QA_SECRET && token.startsWith("qa-")) {
    params.delete("t");
    params.set("cliente_id", token.slice(3));
    headers["x-sync-secret"] = import.meta.env.VITE_QA_SECRET;
  }

  const res = await fetch(`${PORTAL_API}?${params}`, { headers, signal });
  if (res.status === 404) throw new NotFoundError("not found");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
