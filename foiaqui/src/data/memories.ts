import { rotuloLongo } from '@/data/decadas';
import { distanceTo, NEARBY_M, type Position } from '@/data/location';
import type { Memory } from '@/types';

/**
 * O acervo semeado: lugares REAIS de São José dos Campos, com história de
 * fonte pública e coordenadas do OpenStreetMap.
 *
 * As três memórias anteriores (Cine Marrocos, Coreto da Praça, Mural do Beco)
 * eram invenção minha colada num mapa de verdade. Num app cuja moderação
 * pergunta "dá para saber quando foi?", semear ficção sobre uma cidade que
 * existe é reprovar no próprio critério — e pior, ensinar que o acervo pode
 * ser inventado.
 *
 * A autoria fica em "Acervo do protótipo" de propósito. Atribuir isto à
 * Pró-Memória da Câmara ou ao arquivo municipal seria pôr na boca de uma
 * instituição real um texto que ela não escreveu. A fonte vai declarada em
 * cada memória, para quem quiser conferir.
 */
export const memories: Memory[] = [
  {
    id: 'mercado-doacao',
    continuaEm: 'mercado-1923',
    pontoId: 'mercado',
    title: 'O terreno da Rua do Fogo',
    shortName: 'Mercado',
    marker: 'Aqui começou',
    period: '1865',
    year: '1865',
    era: 'Século XIX',
    place: 'Rua Sete de Setembro, Centro',
    coords: { lat: -23.1807493, lng: -45.8859454 },
    story:
      'Em 1865, José Caetano de Mascarenhas Ferraz e sua mulher, D. Mariana Nunes de Araújo, doaram este terreno ao município com uma condição escrita: que aqui se construísse um mercado ou uma praça para o proveito da população. A rua ainda se chamava Rua do Fogo — só depois virou Sete de Setembro. O mercado levaria 58 anos para sair do papel.',
    emphasis: 'com uma condição escrita',
    author: { name: 'Acervo do protótipo', level: 0, role: 'Compilado de fontes públicas' },
    fonte: {
      titulo: '100 anos do Mercado Municipal — Pró-Memória, Câmara de SJC',
      url: 'https://www.camarasjc.sp.gov.br/promemoria/2023/03/10/100-anos-do-mercado-municipal-de-sao-jose-dos-campos/',
    },
    kind: 'Registro documental',
    verified: true,
    media: [{ type: 'photo', uri: 'past' }],
    tags: ['Comércio', 'Centro', 'Documento'],
  },
  {
    id: 'mercado-1923',
    pontoId: 'mercado',
    title: 'Noventa comerciantes',
    shortName: 'Mercado',
    marker: 'Aqui abriu',
    period: '1923',
    year: '1923',
    era: 'Anos 20',
    place: 'Rua Sete de Setembro, Centro',
    coords: { lat: -23.1807493, lng: -45.8859454 },
    story:
      'O Mercado Municipal foi inaugurado em 1923 reunindo noventa comerciantes cadastrados pela prefeitura: peixe, carne, verdura, legume, pastel e artesanato. Em 1994, a Lei 4595 transformou o prédio em elemento de preservação EP-2 — restaurável, desde que as características principais fiquem de pé. Completou cem anos em 2023.',
    emphasis: 'noventa comerciantes',
    author: { name: 'Acervo do protótipo', level: 0, role: 'Compilado de fontes públicas' },
    fonte: {
      titulo: 'Mercado Municipal — ipatrimônio',
      url: 'https://www.ipatrimonio.org/sao-jose-dos-campos-mercado-municipal/',
    },
    kind: 'Registro documental',
    verified: true,
    media: [{ type: 'photo', uri: 'present' }],
    presentImageUri: require('@/assets/fotos/mercado.jpg'),
    creditoFoto: 'Foto: Carlos de Paula · CC BY 3.0 · Wikimedia Commons',
    tags: ['Comércio', 'Centro', 'Tombado'],
  },
  {
    id: 'vicentina-1924',
    continuaEm: 'vicentina-clima',
    pontoId: 'vicentina',
    title: 'O sanatório Vicentina Aranha',
    shortName: 'Vicentina Aranha',
    marker: 'Aqui funcionou',
    period: '1924 — 1952',
    year: '1924',
    era: 'Anos 20',
    place: 'Vila Adyana',
    coords: { lat: -23.1982378, lng: -45.8970653 },
    story:
      'As obras começaram em 1918 e o prédio foi inaugurado ainda incompleto em 27 de abril de 1924, pela Irmandade da Santa Casa de Misericórdia de São Paulo. Projeto de Ramos de Azevedo, execução do engenheiro Augusto Toledo. Foi um dos maiores centros de tratamento de tuberculose da América Latina e o primeiro sanatório da cidade.',
    emphasis: 'um dos maiores da América Latina',
    author: { name: 'Acervo do protótipo', level: 0, role: 'Compilado de fontes públicas' },
    fonte: {
      titulo: '100 anos do Parque Vicentina Aranha — Pró-Memória, Câmara de SJC',
      url: 'https://www.camarasjc.sp.gov.br/promemoria/2024/04/01/100-anos-do-parque-vicentina-aranha/',
    },
    kind: 'Registro documental',
    verified: true,
    media: [{ type: 'photo', uri: 'past' }],
    // o par que faz o slider passado↔presente funcionar com foto real:
    // o sanatório em funcionamento, e o parque que ele virou
    pastImageUri: require('@/assets/fotos/vicentina-sanatorio.jpg'),
    presentImageUri: require('@/assets/fotos/vicentina-hoje.jpg'),
    creditoFoto:
      'Antes: Camila Santana · CC BY-SA 2.0 · Hoje: Ajmcbarreto · CC BY-SA 4.0 · Wikimedia Commons',
    tags: ['Saúde', 'Tuberculose', 'Tombado'],
  },
  {
    id: 'vicentina-clima',
    pontoId: 'vicentina',
    title: 'A cidade que curava pelo ar',
    shortName: 'Vicentina Aranha',
    marker: 'Aqui foi',
    period: '1924 — 1952',
    year: '1935',
    era: 'Anos 30',
    place: 'Vila Adyana',
    coords: { lat: -23.1982378, lng: -45.8970653 },
    story:
      'São José foi escolhida pelo clima: seco e considerado saudável, os médicos passaram a receitar a cidade a quem tinha tuberculose. Ela virou Estância Climatérica, e o período entre 1924 e 1952 é considerado o auge da doença aqui. Uma cidade inteira reorganizada em torno de quem vinha para respirar — e nem todos voltavam.',
    emphasis: 'os médicos passaram a receitar a cidade',
    author: { name: 'Acervo do protótipo', level: 0, role: 'Compilado de fontes públicas' },
    fonte: {
      titulo: 'A fase sanatorial e o Vicentina Aranha — Portal SJC',
      url: 'https://sjc.com.br/a-fase-sanatorial-e-o-vicentina-aranha/',
    },
    kind: 'Registro documental',
    verified: true,
    media: [{ type: 'photo', uri: 'past' }],
    pastImageUri: require('@/assets/fotos/vicentina-sanatorio.jpg'),
    creditoFoto: 'Foto: Camila Santana · CC BY-SA 2.0 · Wikimedia Commons',
    tags: ['Saúde', 'Tuberculose', 'Cidade'],
  },
  {
    id: 'matriz-1934',
    pontoId: 'matriz',
    title: 'A matriz que desabou',
    shortName: 'Igreja Matriz',
    marker: 'Aqui ficava',
    period: '1816 — 1934',
    year: '1934',
    era: 'Anos 30',
    place: 'Praça Cônego Lima, Centro',
    coords: { lat: -23.1802791, lng: -45.8879176 },
    story:
      'O viajante francês Saint-Hilaire, que passou por aqui entre 1816 e 1822, descreveu uma igreja pequena, de torre pouco elevada. Entre 1830 e 1850 os documentos já falam da necessidade de reconstruir a matriz: ela havia desabado, e restava só a capela-mor. A igreja que está de pé hoje foi inaugurada em 1934, com a primeira missa celebrada pelo padre José Fortunato da Silva Ramos.',
    emphasis: 'restava só a capela-mor',
    author: { name: 'Acervo do protótipo', level: 0, role: 'Compilado de fontes públicas' },
    fonte: {
      titulo: '380 anos da Igreja Matriz — Pró-Memória, Câmara de SJC',
      url: 'https://www.camarasjc.sp.gov.br/promemoria/2023/04/28/380-anos-da-igreja-matriz-de-sao-jose-dos-campos/',
    },
    kind: 'Registro documental',
    verified: true,
    media: [{ type: 'photo', uri: 'present' }],
    presentImageUri: require('@/assets/fotos/matriz.jpg'),
    creditoFoto: 'Foto: Themium · CC0 · Wikimedia Commons',
    tags: ['Religião', 'Centro', 'Fundação'],
  },
  {
    id: 'benedito-1876',
    continuaEm: 'matriz-1934',
    pontoId: 'benedito',
    title: 'O bem mais antigo da cidade',
    shortName: 'São Benedito',
    marker: 'Aqui está',
    period: '1876',
    year: '1876',
    era: 'Século XIX',
    place: 'Praça Afonso Pena, 267, Centro',
    coords: { lat: -23.1861851, lng: -45.886922 },
    story:
      'Inaugurada em 1876, a Igreja de São Benedito é o patrimônio mais antigo de São José dos Campos, tombada pelo Condephaat em 25 de julho de 1980. Em 1933, quando a matriz estava sendo reconstruída, ela assumiu por um tempo o posto de igreja matriz da cidade.',
    emphasis: 'o patrimônio mais antigo',
    author: { name: 'Acervo do protótipo', level: 0, role: 'Compilado de fontes públicas' },
    fonte: {
      titulo: 'Centro (São José dos Campos) — Wikipédia',
      url: 'https://pt.wikipedia.org/wiki/Centro_(S%C3%A3o_Jos%C3%A9_dos_Campos)',
    },
    kind: 'Registro documental',
    verified: true,
    media: [{ type: 'photo', uri: 'present' }],
    tags: ['Religião', 'Centro', 'Tombado'],
  },

  {
    id: 'parahyba-1925',
    continuaEm: 'parahyba-vila',
    pontoId: 'parahyba',
    title: 'A Tecelagem Parahyba',
    shortName: 'Parahyba',
    marker: 'Aqui funcionou',
    period: '1925 — anos 90',
    year: '1925',
    era: 'Anos 20',
    place: 'Bairro Santana',
    coords: { lat: -23.1647672, lng: -45.8852943 },
    story:
      'A Companhia Fiação e Tecelagem Parahyba foi criada em 14 de março de 1925 e começou a operar em 1927, produzindo tecidos de algodão em 7.491 metros quadrados no Santana — colada na estação ferroviária nova, inaugurada dois anos antes. Foi a primeira indústria do município, e por décadas o nome da cidade em cobertor e colcha era o dela.',
    emphasis: 'a primeira indústria do município',
    author: { name: 'Acervo do protótipo', level: 0, role: 'Compilado de fontes públicas' },
    fonte: {
      titulo: 'Conjunto da Tecelagem Parahyba — ipatrimônio',
      url: 'https://www.ipatrimonio.org/sao-jose-dos-campos-conjunto-da-tecelagem-parahyba/',
    },
    kind: 'Registro documental',
    verified: true,
    media: [{ type: 'photo', uri: 'past' }],
    tags: ['Indústria', 'Trabalho', 'Tombado'],
  },
  {
    id: 'parahyba-vila',
    continuaEm: 'parahyba-tombamento',
    pontoId: 'parahyba',
    title: 'A vila das 26 casas',
    shortName: 'Parahyba',
    marker: 'Aqui morava',
    period: 'Anos 20',
    year: '1928',
    era: 'Anos 20',
    place: 'Bairro Santana',
    coords: { lat: -23.1647672, lng: -45.8852943 },
    story:
      'Junto dos galpões de produção, a companhia levantou na segunda metade dos anos 1920 uma vila operária com 26 casas, mais as residências da administração e de hóspedes. Morar onde se trabalha mudava tudo: o turno, a vizinhança, a hora do jantar e quem seriam seus amigos pelo resto da vida.',
    emphasis: '26 casas',
    author: { name: 'Acervo do protótipo', level: 0, role: 'Compilado de fontes públicas' },
    fonte: {
      titulo: 'História da Tecelagem Parahyba — SJC Antigamente',
      url: 'https://www.sjcantigamente.com.br/historia-da-tecelagem-parahyba/',
    },
    kind: 'Registro documental',
    verified: true,
    media: [{ type: 'photo', uri: 'past' }],
    tags: ['Indústria', 'Trabalho', 'Moradia'],
  },
  {
    id: 'parahyba-tombamento',
    pontoId: 'parahyba',
    title: 'A fábrica que virou parque',
    shortName: 'Parahyba',
    marker: 'Aqui está',
    period: '2021',
    year: '2021',
    era: 'Anos 2020',
    place: 'Parque da Cidade, Bairro Santana',
    coords: { lat: -23.1647672, lng: -45.8852943 },
    story:
      'O escritório de Rino Levi projetou a casa da família Olívio Gomes, dona da tecelagem, e Roberto Burle Marx desenhou os jardins que costuram a arquitetura à paisagem. Em 10 de novembro de 2021 o IPHAN tombou o conjunto em três livros — Histórico, Arqueológico/Etnográfico/Paisagístico e Belas Artes. Hoje o terreno é o Parque da Cidade Roberto Burle Marx e a Fundação Cultural Cassiano Ricardo: a fábrica virou o quintal da cidade.',
    emphasis: 'a fábrica virou o quintal da cidade',
    author: { name: 'Acervo do protótipo', level: 0, role: 'Compilado de fontes públicas' },
    fonte: {
      titulo: 'Conjunto da Tecelagem Parahyba — ipatrimônio',
      url: 'https://www.ipatrimonio.org/sao-jose-dos-campos-conjunto-da-tecelagem-parahyba/',
    },
    kind: 'Registro documental',
    verified: true,
    media: [{ type: 'photo', uri: 'present' }],
    tags: ['Indústria', 'Tombado', 'Parque'],
  },
  {
    id: 'estacao-1925',
    continuaEm: 'parahyba-1925',
    pontoId: 'estacao',
    title: 'A estação nova',
    shortName: 'Estação',
    marker: 'Aqui chegou',
    period: '1925',
    year: '1925',
    era: 'Anos 20',
    place: 'Rua Maceió, Vila Terezinha',
    coords: { lat: -23.1738329, lng: -45.8856472 },
    story:
      'A estação ferroviária nova foi inaugurada em 1925, e não por acaso a Tecelagem Parahyba se instalou ao lado dois anos depois: trilho e fábrica chegavam juntos, e foi por aqui que a cidade deixou de ser passagem para virar destino. Quem vinha tratar tuberculose no sanatório também desembarcava aqui.',
    emphasis: 'trilho e fábrica chegavam juntos',
    author: { name: 'Acervo do protótipo', level: 0, role: 'Compilado de fontes públicas' },
    fonte: {
      titulo: 'Conjunto da Tecelagem Parahyba — ipatrimônio',
      url: 'https://www.ipatrimonio.org/sao-jose-dos-campos-conjunto-da-tecelagem-parahyba/',
    },
    kind: 'Registro documental',
    verified: true,
    media: [{ type: 'photo', uri: 'past' }],
    tags: ['Transporte', 'Indústria', 'Centro'],
  },
  {
    id: 'paco-1926',
    pontoId: 'paco',
    title: 'O paço do argentino',
    shortName: 'Paço Municipal',
    marker: 'Aqui está',
    period: '1926',
    year: '1926',
    era: 'Anos 20',
    place: 'Praça Afonso Pena, 29, Centro',
    coords: { lat: -23.1851309, lng: -45.887515 },
    story:
      'O Paço Municipal foi construído em 1926, com projeto do arquiteto argentino Mauricio Erro, na Praça Afonso Pena. Foi tombado pela Lei Municipal 4632 de 1994, na mesma leva que protegeu o Mercado. É de onde a cidade se administra desde antes de existir avião, rodovia ou instituto de pesquisa por aqui.',
    emphasis: 'projeto do arquiteto argentino Mauricio Erro',
    author: { name: 'Acervo do protótipo', level: 0, role: 'Compilado de fontes públicas' },
    fonte: {
      titulo: 'Paço Municipal — ipatrimônio',
      url: 'https://www.ipatrimonio.org/sao-jose-dos-campos-paco-municipal/',
    },
    kind: 'Registro documental',
    verified: true,
    media: [{ type: 'photo', uri: 'present' }],
    tags: ['Poder público', 'Centro', 'Tombado'],
  },
  {
    id: 'artesacra-1908',
    pontoId: 'artesacra',
    title: 'A capela de 1908',
    shortName: 'Arte Sacra',
    marker: 'Aqui está',
    period: '1908',
    year: '1908',
    era: 'Anos 00',
    place: 'Travessa Chico Luiz, 67, Centro',
    coords: { lat: -23.1808363, lng: -45.885489 },
    story:
      'A Capela de Nossa Senhora Aparecida foi construída em 1908 e hoje abriga o Museu de Arte Sacra, preservada pela Fundação Cultural Cassiano Ricardo e pelo COMPHAC. Um prédio pequeno, no meio do centro, que sobreviveu a tudo que foi derrubado em volta.',
    emphasis: 'sobreviveu a tudo que foi derrubado em volta',
    author: { name: 'Acervo do protótipo', level: 0, role: 'Compilado de fontes públicas' },
    fonte: {
      titulo: 'Museus e prédios históricos — Prefeitura de São José dos Campos',
      url: 'https://www.sjc.sp.gov.br/servicos/inovacao-e-desenvolvimento-economico/turismo/museus-e-predios-historicos/',
    },
    kind: 'Registro documental',
    verified: true,
    media: [{ type: 'photo', uri: 'present' }],
    tags: ['Religião', 'Centro', 'Museu'],
  },
];

export const memoryById = (id?: string) => memories.find((m) => m.id === id);

/**
 * Chips de filtro do mapa.
 *
 * Cada um carrega o próprio critério em vez de ser só um rótulo — era isso que
 * faltava para eles filtrarem de verdade. "Escolas" não casa com nada no acervo
 * atual, de propósito: é o caso que exercita o estado vazio, que na rua acontece
 * o tempo todo.
 */
/** O que o filtro precisa saber além da própria memória. */
export interface FilterContext {
  /** onde a pessoa está agora — GPS de verdade ou fallback */
  from: Position;
}

export interface MapFilter {
  id: string;
  /** texto do chip */
  label: string;
  /**
   * Como o filtro é dito no contador: "2 memórias PERTO DE VOCÊ".
   * Separado do rótulo porque em português a preposição muda com o termo —
   * derivar do label dá frases quebradas como "em perto de mim".
   */
  countLabel: string;
  match: (memory: Memory, ctx: FilterContext) => boolean;
}

export const mapFilters: MapFilter[] = [
  {
    id: 'perto',
    label: 'Perto de mim',
    countLabel: 'perto de você',
    // agora com a posição real: "perto de mim" passou a significar perto de você
    match: (m, ctx) => distanceTo(m, ctx.from) <= NEARBY_M,
  },
  // O filtro de época saiu daqui: virou a linha do tempo sobre o mapa
  // (Decisão 11). Um chip fixo de "Anos 60" e uma régua de décadas são dois
  // controles para a mesma pergunta, e o chip só cobria uma década.
  {
    id: 'tombado',
    label: 'Tombados',
    countLabel: 'de bens tombados',
    match: (m) => m.tags.includes('Tombado'),
  },
  {
    id: 'sanatorial',
    label: 'Fase sanatorial',
    countLabel: 'da fase sanatorial',
    match: (m) => m.tags.includes('Tuberculose'),
  },
  {
    id: 'comercio',
    label: 'Comércio',
    countLabel: 'de comércio',
    match: (m) => m.tags.includes('Comércio'),
  },
  {
    id: 'religiao',
    label: 'Religião',
    countLabel: 'de vida religiosa',
    match: (m) => m.tags.includes('Religião'),
  },
  {
    id: 'escola',
    label: 'Escolas',
    countLabel: 'de escolas',
    // Vazio de propósito, e é o único assim: exercita o estado vazio, que na
    // rua acontece o tempo todo. Os outros filtros ficaram órfãos quando o
    // acervo trocou de conteúdo — "Cinemas antigos" e "Arte urbana" buscavam
    // tags que deixaram de existir e devolviam zero sempre, o que é bem
    // diferente de devolver zero de propósito.
    match: (m) => m.tags.includes('Escola'),
  },
];

/** Épocas oferecidas no fluxo de adicionar memória. */
/**
 * As épocas oferecidas a quem envia.
 *
 * Era uma lista fixa que ia dos anos 40 aos 70. Quando o acervo passou a ter
 * 1865, 1876 e 1923, ficou impossível classificar a própria memória semeada
 * pelo formulário do app — a régua de quem envia era mais estreita que a
 * realidade da cidade. Agora ela é gerada, vai de "antes de 1900" até a década
 * corrente, e envelhece sozinha.
 *
 * Continua existindo mesmo com o campo de ano exato ao lado: quem lembra "foi
 * nos anos 60" e não sabe o ano precisa de um jeito de dizer isso sem chutar
 * um número, e chute registrado como data vira dado falso.
 */
export const eras: string[] = (() => {
  const atual = new Date().getFullYear();
  const ultimaDecada = Math.floor(atual / 10) * 10;
  const lista = ['Antes de 1900'];
  for (let d = 1900; d <= ultimaDecada; d += 10) lista.push(rotuloLongo(d));
  lista.push('Atual');
  return lista;
})();

/**
 * Normaliza para busca: sem acento, sem caixa.
 *
 * Obrigatório em português — quem digita "memoria", "praca" ou "comercio"
 * precisa encontrar "memória", "praça" e "comércio". Sem isso a busca só
 * funciona pra quem acentua certo no teclado do celular, que é quase ninguém.
 */
const normalize = (s: string) =>
  s
    // NFD separa a letra do acento: "á" vira "a" + acento combinante.
    // O intervalo do replace abaixo é U+0300–U+036F, o bloco desses acentos —
    // eles aparecem como caracteres invisíveis aqui no código. Não "conserte"
    // achando que é lixo de codificação: sem essa linha, buscar "praca" não
    // encontra "Praça".
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/**
 * A busca do mapa: lugar, época ou tema, como diz o próprio campo.
 * Casa contra tudo que a pessoa poderia ter na cabeça ao procurar —
 * inclusive o nome de quem contou.
 */
export function matchesQuery(memory: Memory, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const alvo = normalize(
    [
      memory.title,
      memory.shortName,
      memory.place,
      memory.era,
      memory.year,
      memory.period,
      memory.kind,
      memory.author.name,
      ...memory.tags,
    ].join(' '),
  );
  // cada palavra digitada precisa aparecer: "cine 1958" acha, "xyz 1958" não
  return q.split(/\s+/).every((termo) => alvo.includes(termo));
}

/** tipos de logradouro: sozinhos não identificam nada */
const TIPOS_DE_VIA = [
  'rua', 'avenida', 'av', 'praca', 'praça', 'alameda', 'travessa',
  'estrada', 'rodovia', 'largo', 'beco', 'viela', 'via', 'ladeira',
];

/**
 * Nome curto para caber na chapa do pin.
 *
 * O corte anterior era um `.slice(0, 14)` seco e cortava no meio da palavra:
 * "Parque Industrial" virava "PARQUE INDUSTR", "Avenida Deputado" virava
 * "AVENIDA DEPUTA". A placa é estreita de propósito — nome de rua precisa
 * caber em chapa estreita —, então truncar é inevitável; truncar feio não é.
 *
 * Duas regras: palavras inteiras, e o tipo da via sai primeiro se o nome não
 * couber com ele. "Rua José Cobra" vira "José Cobra", não "Rua José Cob".
 */
export function nomeCurto(endereco: string | null | undefined, limite = 18): string {
  const bruto = (endereco ?? '').split(',')[0].trim();
  if (!bruto) return 'Aqui';

  let palavras = bruto.split(' ').filter(Boolean);
  const primeira = palavras[0].toLowerCase().split('.').join('');
  if (palavras.length > 1 && TIPOS_DE_VIA.includes(primeira) && bruto.length > limite) {
    palavras = palavras.slice(1);
  }

  let saida = '';
  for (const p of palavras) {
    const tentativa = saida ? saida + ' ' + p : p;
    if (tentativa.length > limite) break;
    saida = tentativa;
  }
  // uma palavra só, e nem ela cabe
  return saida || palavras[0].slice(0, limite - 1) + '…';
}
