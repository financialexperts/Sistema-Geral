(function (global) {
  "use strict";

  // O cliente do Supabase de cada sistema. A URL e a chave vêm do portal
  // (backend/config/supabase.js, o mesmo banco de todos os sistemas), e a
  // sessão também: é a que o portal abriu no login, guardada pelo navegador
  // (veja apps/compartilhado/portal.js). Se a biblioteca não carregou (sem
  // internet, CDN fora do ar), o sistema mostra o aviso em vez de travar.
  var cfg = global.SUPABASE_CONFIG || {};
  var lib = global.supabase && global.supabase.createClient ? global.supabase : null;
  var isConfigured = !!(cfg.url && cfg.anonKey && lib);

  global.DB = {
    isConfigured: isConfigured,
    client: isConfigured ? lib.createClient(cfg.url, cfg.anonKey) : null
  };
})(window);
