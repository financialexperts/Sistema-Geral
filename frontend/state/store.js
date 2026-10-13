// Estado central da aba aberta: um objeto só, lido e alterado pelas telas.
export const state = {
  usuario: null,   // usuário do Supabase Auth (id, email, user_metadata)
  perfil: null,    // linha dele em `profiles` (null enquanto não chega, ou se não deu)
  rota: null,      // a tela mostrada agora (frontend/features/app/rotas.js)
};
