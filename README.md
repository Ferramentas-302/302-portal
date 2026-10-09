# 302 Portal

Portal do cliente da 302 Digital ("gestão à vista") — portal.302digital.com.br.

- Hospedagem: Cloudflare Pages (build `npm run build`, saída `dist`, Node 22).
- Dados: Supabase do 302 Core, via edge function `portal-api`.
- Escopo e plano técnico: ficam no workspace da agência (`302 Digital/portal-cliente/`).

Rotas: `/c/<token>` (portal do cliente) e `/mestre` (login do 302 Core, seção perf.portal).
Teste local com dados reais: `.env.local` com `VITE_QA_SECRET` e `/c/qa-<cliente_id>` (só no `npm run dev`).
