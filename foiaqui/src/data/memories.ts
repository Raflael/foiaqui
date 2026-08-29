import type { Memory } from '@/types';

/**
 * As 3 memórias do protótipo. Coordenadas reais de Santos-SP (cidade da Íris),
 * mas as posições no mapa stub vêm de `mapPos` — ver `<MapCanvas>`.
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
    mapPos: { left: '29%', top: '38%' },
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
    mapPos: { left: '63%', top: '30%' },
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
    mapPos: { left: '74%', top: '58%' },
  },
];

export const memoryById = (id?: string) => memories.find((m) => m.id === id);

/** Chips de filtro da busca no mapa. */
export const mapFilters = [
  'Perto de mim',
  'Anos 60',
  'Cinemas antigos',
  'Arte urbana',
  'Escolas',
] as const;

/** Épocas oferecidas no fluxo de adicionar memória. */
export const eras = ['Anos 40', 'Anos 50', 'Anos 60', 'Anos 70', 'Atual'] as const;
