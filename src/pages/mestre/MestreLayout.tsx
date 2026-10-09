import { useCallback, useEffect, useState, type FormEvent } from "react";
import { NavLink, Outlet, useOutletContext } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../supabase";

export type MestreCtx = { session: Session; toast: (m: string) => void };
export const useMestre = () => useOutletContext<MestreCtx>();

export default function MestreLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Mestre · Portal 302";
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setAllowed(null); return; }
    supabase.rpc("has_section", { _prefix: "perf.portal" }).then(({ data }) => setAllowed(data === true));
  }, [session]);

  const toast = useCallback((m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2500); }, []);

  if (session === undefined) return null;
  if (!session) return <Login />;
  if (allowed === null) return null;
  if (!allowed) {
    return (
      <div className="center-screen"><div>
        <h1 style={{ fontSize: 22 }}>Sem acesso</h1>
        <p className="sub">Seu usuário não tem a permissão “Portal do cliente” (perf.portal) no 302 Core.</p>
        <button type="button" className="btn-line" onClick={() => supabase.auth.signOut()}>Sair</button>
      </div></div>
    );
  }

  return (
    <div className="app">
      <header className="m-top">
        <div className="topbar-inner">
          <strong style={{ fontSize: 17 }}>302 · Portal</strong>
          <span className="m-badge">Mestre</span>
          <nav style={{ display: "flex", gap: 16 }} aria-label="Mestre">
            <NavLink to="/mestre" end className={({ isActive }) => (isActive ? "active" : "")}>Clientes</NavLink>
            <NavLink to="/mestre/diario" className={({ isActive }) => (isActive ? "active" : "")}>Diário</NavLink>
          </nav>
          <span style={{ marginLeft: "auto", fontSize: 13, color: "#c9c6c4" }}>{session.user.email}</span>
          <button type="button" className="btn-line" style={{ background: "transparent", color: "#fff", borderColor: "#555" }} onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
      </header>
      <Outlet context={{ session, toast } satisfies MestreCtx} />
      {msg && <div className="toast" role="status">{msg}</div>}
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr("E-mail ou senha incorretos.");
    setBusy(false);
  };
  return (
    <div className="center-screen">
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 14 }}>
        <img src="/logo-302.png" alt="302 digital" style={{ width: 110, alignSelf: "center" }} />
        <h1 style={{ fontSize: 20, textAlign: "center" }}>Área do mestre</h1>
        <p className="sub" style={{ textAlign: "center" }}>Entre com o mesmo login do 302 Core.</p>
        <label className="field">E-mail<input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="field">Senha<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {err && <p className="banner" role="alert">{err}</p>}
        <button className="btn-dark" type="submit" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
      </form>
    </div>
  );
}
