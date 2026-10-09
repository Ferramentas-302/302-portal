// Valores PÚBLICOS do Supabase do 302 Core (a anon key é pública por natureza:
// o acesso aos dados é controlado por RLS e pela edge function portal-api).
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://vepdxkmlmdvdgbhckfss.supabase.co";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlcGR4a21sbWR2ZGdiaGNrZnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTI4MDAsImV4cCI6MjA4MTY2ODgwMH0.KmTGdx58WnKqsUp9H5Y9p-4HWHEZZuYcVi90tImuHlk";
export const PORTAL_API = `${SUPABASE_URL}/functions/v1/portal-api`;
