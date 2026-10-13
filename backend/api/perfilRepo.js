import { sb } from './supabaseClient.js';

// A linha do aluno em `profiles`, a tabela que todos os sistemas usam: o nome
// do cadastro e o que cada sistema guarda dele (a planilha do Fluxo de Caixa,
// o perfil da Carteira…). O RLS do banco só devolve a linha da própria pessoa.

export async function buscarPerfil(usuarioId) {
  const { data, error } = await sb.from('profiles').select('*').eq('id', usuarioId).maybeSingle();
  if (error) throw error;
  return data;
}

// O nome do "Criar conta", como os sistemas sempre gravaram: upsert (não
// update), porque o gatilho do banco que cria a linha no cadastro pode ainda
// não ter rodado — um update casaria zero linhas, sem erro, e o nome se perderia.
export async function salvarNome(usuarioId, nome) {
  const { error } = await sb.from('profiles').upsert({ id: usuarioId, full_name: nome }, { onConflict: 'id' });
  if (error) throw error;
}
