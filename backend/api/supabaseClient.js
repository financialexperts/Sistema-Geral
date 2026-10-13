// O SDK do Supabase vem por <script> no index.html (sem passo de build), e a
// URL e a chave, de backend/config/supabase.js: o mesmo arquivo que os
// sistemas em apps/ usam, então todos falam com o mesmo banco e os mesmos
// logins. Se a CDN não carregar, `sb` fica nulo e a tela de acesso mostra o
// aviso em vez de quebrar em silêncio.
const config = window.SUPABASE_CONFIG ?? {};

export const SUPABASE_URL = config.url ?? '';

export const sb = window.supabase?.createClient && config.url && config.anonKey
  ? window.supabase.createClient(config.url, config.anonKey)
  : null;
