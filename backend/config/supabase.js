// O banco de dados de todos os sistemas da Financial Experts: um projeto
// Supabase só, com os mesmos logins (Supabase Auth) e as mesmas tabelas
// (profiles, categories, game_scores…). O portal (index.html) e cada sistema
// em apps/ carregam este mesmo arquivo, então trocar o projeto é mexer só aqui.
//
// Script comum (não módulo) de propósito: os sistemas em apps/ não usam
// módulos JavaScript e leem window.SUPABASE_CONFIG, como sempre leram.
//
// A chave é a pública ("publishable"): vai no navegador de qualquer visitante.
// Quem protege os dados de cada aluno são as políticas de RLS do banco, não
// este arquivo.
window.SUPABASE_CONFIG = {
  url: "https://xorqsuqjmvkyzgagdxfz.supabase.co",
  anonKey: "sb_publishable_5gNQFFXz8sb4jQqE3mrA0Q_gqhLZ-Sx"
};
