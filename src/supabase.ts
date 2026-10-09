import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

// Usado só pela área do mestre (login + tabelas protegidas por RLS/perf.portal).
// O portal do cliente não lê tabela nenhuma: fala só com a edge function portal-api.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, storageKey: "302-portal-auth" },
});
