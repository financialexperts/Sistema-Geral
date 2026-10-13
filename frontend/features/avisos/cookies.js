// Aviso de cookies (LGPD). Tudo o que o portal e os sistemas guardam no
// navegador é necessário para eles funcionarem (a sessão do login, o tema,
// os rascunhos), então a LGPD pede só que a pessoa seja avisada, sem opção
// de recusar. Se um dia entrar analytics ou pixel de anúncio, aí precisa de
// um botão "Recusar" e só carregar esses scripts depois do "Aceitar".
//
// O cookie é o mesmo que a Carteira de Investimentos já usava
// (aviso_cookies), então quem já tinha tocado em "Entendi" lá não vê de novo.

const COOKIE = 'aviso_cookies';

export function iniciarAvisoDeCookies() {
  const aviso = document.getElementById('aviso-cookies');
  if (lerCookie(COOKIE)) return;
  aviso.hidden = false;
  document.getElementById('btn-cookies').addEventListener('click', () => {
    gravarCookie(COOKIE, 'ok', 365);
    aviso.hidden = true;
  });
}

// O "Secure" só vai quando a página está em https: aberto por
// http://localhost o navegador descartaria o cookie.
function gravarCookie(nome, valor, dias) {
  const partes = [
    `${encodeURIComponent(nome)}=${encodeURIComponent(valor)}`,
    `max-age=${Math.round(dias * 24 * 60 * 60)}`,
    'path=/',
    'SameSite=Lax',
  ];
  if (location.protocol === 'https:') partes.push('Secure');
  document.cookie = partes.join('; ');
}

function lerCookie(nome) {
  const chave = `${encodeURIComponent(nome)}=`;
  const achado = document.cookie.split('; ').find(c => c.startsWith(chave));
  if (!achado) return null;
  try { return decodeURIComponent(achado.slice(chave.length)); } catch { return null; }
}
