// O catálogo do portal: os cursos e os sistemas de cada um. É o único lugar
// que muda para aparecer um sistema ou um curso novo (o passo a passo
// completo está no README, em "Como adicionar um sistema").
//
// Um sistema pode estar em mais de um curso (as calculadoras e a carteira
// estão no Elas e no Master): ele é cadastrado uma vez em SISTEMAS e o id
// dele entra na lista `sistemas` de cada curso, na ordem em que deve aparecer.

// ---------- Cursos ----------
// cores (as da logo de cada curso):
//   destaque  cor principal da logo
//   brilho    segunda cor (brilho, degradê)
//   texto     a cor do curso em texto e ícones sobre branco (contraste 4,5:1 ou mais)
//   fundo     começo e fim do degradê da arte do curso (fundo2 é o lado claro/alto)
// tom: 'escuro' ou 'claro' — o fundo da arte, que decide a cor do texto sobre ela
// arte: o desenho animado do curso (frontend/styles/arte.css): 'neon', 'aurora'
//   ou 'geometria'. Um curso novo pode reaproveitar qualquer um com as cores dele.
export const CURSOS = [
  {
    id: 'evolution',
    nome: 'Evolution',
    nomeCompleto: 'Financial Evolution',
    descricao: 'Monte o seu fluxo de caixa, combine as fontes de renda da Laura e faça as contas das escolhas da Vanessa e da Karine.',
    logo: 'frontend/img/cursos/evolution-logo.png',
    arte: 'neon',
    tom: 'escuro',
    cores: { destaque: '#1F8BFF', brilho: '#39D5FF', texto: '#0A6CF0', fundo: '#030919', fundo2: '#0A1F5C' },
    sistemas: ['fluxo-de-caixa', 'laura', 'vanessa-e-karine'],
  },
  {
    id: 'elas',
    nome: 'Elas',
    nomeCompleto: 'Finanças para Elas',
    descricao: 'Simule juros compostos, resolva as cinco funções financeiras e monte a sua carteira de investimentos.',
    logo: 'frontend/img/cursos/elas-logo.png',
    arte: 'aurora',
    tom: 'claro',
    cores: { destaque: '#13B6C0', brilho: '#1CC7A3', texto: '#0B7F88', fundo: '#F2FFFC', fundo2: '#CFF4EE' },
    sistemas: ['calculadora-de-juros', 'calculadora-financeira', 'carteira-de-investimentos'],
  },
  {
    id: 'master',
    nome: 'Master',
    nomeCompleto: 'Financial Master',
    descricao: 'Simule juros compostos, resolva as cinco funções financeiras e monte a sua carteira de investimentos.',
    logo: 'frontend/img/cursos/master-logo.png',
    arte: 'geometria',
    tom: 'escuro',
    cores: { destaque: '#00AAFF', brilho: '#7FD4FF', texto: '#0077C2', fundo: '#020409', fundo2: '#0A1830' },
    sistemas: ['calculadora-de-juros', 'calculadora-financeira', 'carteira-de-investimentos'],
  },
];

// ---------- Sistemas ----------
// endereco   a página do sistema, a partir da raiz do portal (fica em apps/<id>/)
// paginas    em vez de endereco, quando o sistema tem mais de uma atividade:
//            [{ id, nome, endereco }] — o cabeçalho mostra uma aba para cada
// icone      desenho do ícone (frontend/features/sistemas/icones.js)
// temaEscuro o sistema tem tema claro e escuro: o cabeçalho mostra o botão
// resumo     opcional: uma linha sobre o aluno no sistema, feita a partir da
//            linha dele em `profiles` (a tabela que todos os sistemas usam)
export const SISTEMAS = [
  {
    id: 'fluxo-de-caixa',
    nome: 'Fluxo de Caixa',
    descricao: 'Sua receita e seus gastos mês a mês, numa planilha que mostra quanto você já economizou.',
    icone: 'fluxo',
    endereco: 'apps/fluxo-de-caixa/index.html',
    temaEscuro: true,
    resumo(perfil) {
      if (!perfil?.onboarding_completed) return 'Comece montando a sua planilha';
      const fim = mesPorExtenso(perfil.plan_end_month);
      return fim ? `Planilha pronta até ${fim}` : 'Sua planilha está pronta';
    },
  },
  {
    id: 'laura',
    nome: 'Laura',
    descricao: 'Simulador de renda: escolha como a Laura vai gerar renda com R$ 30 mil e 10 horas por dia, e veja o que muda numa crise.',
    icone: 'renda',
    endereco: 'apps/laura/index.html',
    temaEscuro: true,
  },
  {
    id: 'vanessa-e-karine',
    nome: 'Vanessa e Karine',
    descricao: 'Faça as contas das escolhas das duas ao longo de 40 anos e jogue o Seu dinheiro no tempo.',
    icone: 'balanca',
    paginas: [
      { id: 'escolhas', nome: 'Vanessa e Karine', endereco: 'apps/vanessa-e-karine/index.html' },
      { id: 'dinheiro-no-tempo', nome: 'Seu dinheiro no tempo', endereco: 'apps/vanessa-e-karine/dinheiro-no-tempo.html' },
    ],
    temaEscuro: true,
  },
  {
    id: 'calculadora-de-juros',
    nome: 'Calculadora de Juros',
    descricao: 'Quanto você vai ter, quanto precisa poupar por mês e quanto poderá gastar na aposentadoria.',
    icone: 'juros',
    endereco: 'apps/calculadora-de-juros/index.html',
    temaEscuro: true,
  },
  {
    id: 'calculadora-financeira',
    nome: 'Calculadora Financeira',
    descricao: 'As cinco funções da planilha: parcela, valor final, valor inicial, taxa de juros e número de períodos.',
    icone: 'calculadora',
    endereco: 'apps/calculadora-financeira/index.html',
    temaEscuro: true,
  },
  {
    id: 'carteira-de-investimentos',
    nome: 'Carteira de Investimentos',
    descricao: 'Descubra o seu perfil de investidor, monte a sua carteira e compare com a sugerida para você.',
    icone: 'carteira',
    endereco: 'apps/carteira-de-investimentos/index.html',
    temaEscuro: true,
    resumo(perfil) {
      const perfis = { conservador: 'Conservador', moderado: 'Moderado', arrojado: 'Arrojado' };
      const nome = perfis[perfil?.investor_profile];
      return nome ? `Seu perfil: ${nome}` : 'Descubra o seu perfil de investidor';
    },
  },
];

// "2027-12-01" → "dez. de 2027"
function mesPorExtenso(data) {
  const [ano, mes] = String(data ?? '').split('-').map(Number);
  if (!ano || !mes) return '';
  return new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}
