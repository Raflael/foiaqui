import { distanceTo, NEARBY_M } from '@/data/location';
import type { Memory } from '@/types';

/**
 * As 3 memórias do protótipo, em coordenadas reais de Santos-SP —
 * a cidade da Íris. É por elas que os marcadores se posicionam no mapa.
 */
export const memories: Memory[] = [
  {
    id: 'cine',
    title: 'Cine Marrocos',
    shortName: 'Cine',
    marker: 'Aqui funcionou',
    period: '1958 — 1974',
    year: '1958',
    era: 'Anos 50',
    place: 'Rua do Comércio, 210',
    coords: { lat: -23.9331, lng: -46.3286 },
    story:
      'Aqui funcionou o Cine Marrocos, o point da cidade nos fins de semana. Minha mãe contava das filas que dobravam a esquina em cada estreia. O cinema fechou em 1974 e o prédio virou uma loja de departamentos — mas o letreiro ainda vive na memória de quem passou por aqui.',
    emphasis: 'Cine Marrocos',
    author: { name: 'Íris N.', level: 4, role: 'Guardiã · Nível 4' },
    kind: 'Foto + relato',
    verified: true,
    media: [
      { type: 'photo', uri: 'past' },
      { type: 'audio', uri: 'relato-iris' },
    ],
    audioSeconds: 72,
    tags: ['Cinema', 'Lazer', 'Centro'],
  },
  {
    id: 'praca',
    title: 'Coreto da Praça',
    shortName: 'Praça',
    marker: 'Aqui ficava',
    period: '1962 — 1998',
    year: '1962',
    era: 'Anos 60',
    place: 'Praça do Rosário',
    coords: { lat: -23.9348, lng: -46.3269 },
    story:
      'O coreto original da praça, onde havia retreta aos domingos. A banda tocava ao entardecer e a cidade descia pra ouvir. O coreto de hoje é uma réplica erguida em 1998, depois que o antigo foi demolido.',
    emphasis: 'coreto original',
    author: { name: 'Arquivo da Cidade', level: 9, role: 'Instituição · Verificada' },
    kind: 'Foto histórica',
    verified: true,
    media: [{ type: 'photo', uri: 'past' }],
    tags: ['Praça', 'Música', 'Demolido'],
  },
  {
    id: 'mural',
    title: 'Mural do Beco',
    shortName: 'Mural',
    marker: 'Aqui está',
    period: '2019',
    year: '2019',
    era: 'Atual',
    place: 'Beco da Estação',
    coords: { lat: -23.9362, lng: -46.3241 },
    story:
      'Mural coletivo pintado por artistas locais no festival de 2019. Cada painel conta um pedaço da história do bairro operário — das fábricas às pessoas que moveram esta parte da cidade.',
    emphasis: 'Mural coletivo',
    author: { name: 'Théo A.', level: 2, role: 'Explorador · Nível 2' },
    kind: 'Foto + microdoc',
    verified: false,
    media: [
      { type: 'photo', uri: 'past' },
      { type: 'video', uri: 'microdoc' },
    ],
    audioSeconds: 48,
    tags: ['Arte urbana', 'Bairro operário'],
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
  match: (memory: Memory) => boolean;
}

export const mapFilters: MapFilter[] = [
  {
    id: 'perto',
    label: 'Perto de mim',
    countLabel: 'perto de você',
    match: (m) => distanceTo(m) <= NEARBY_M,
  },
  { id: 'anos60', label: 'Anos 60', countLabel: 'dos anos 60', match: (m) => m.era === 'Anos 60' },
  {
    id: 'cinema',
    label: 'Cinemas antigos',
    countLabel: 'em cinemas antigos',
    match: (m) => m.tags.includes('Cinema'),
  },
  {
    id: 'arte',
    label: 'Arte urbana',
    countLabel: 'de arte urbana',
    match: (m) => m.tags.includes('Arte urbana'),
  },
  { id: 'escola', label: 'Escolas', countLabel: 'de escolas', match: (m) => m.tags.includes('Escola') },
];

/** Épocas oferecidas no fluxo de adicionar memória. */
export const eras = ['Anos 40', 'Anos 50', 'Anos 60', 'Anos 70', 'Atual'] as const;

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
