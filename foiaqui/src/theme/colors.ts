/**
 * Tokens de cor do FoiAqui — direção "Placa Esmaltada".
 *
 * A referência é a placa de rua brasileira de chapa esmaltada (anos 1930–80):
 * fundo azul, letra e MOLDURA em branco. Ela sumiu das cidades quando trocaram
 * por alumínio e PVC — ou seja, a própria placa é memória urbana desaparecendo.
 * E placas comemorativas dizem literalmente "AQUI FUNCIONOU". O nome do app é
 * a fala da placa.
 *
 * REGRA ESTRUTURAL (substitui a antiga escuro/papel):
 *
 *   cal      = a cidade, de dia. É onde a pessoa anda: mapa, listas, perfil.
 *   esmalte  = a memória marcada no lugar. Toda memória aparece como placa.
 *   ferrugem = o tempo agindo. Ações, o que é humano e imperfeito.
 *
 * Claro de propósito, e isso corrige uma contradição do spec antigo: a Decisão 7
 * da pesquisa diz que o uso real é "sol na tela, mão ocupada, sinal instável",
 * mas o app era escuro por um motivo poético. Interface escura sob sol direto é
 * pior de ler — e a persona principal tem 70 anos.
 */
export const colors = {
  // a cidade de dia — o chão do app
  cal: '#F4F3EE',
  cal2: '#EAE8E0',
  cal3: '#DFDCD1',
  calLine: '#CFCABA',

  // a placa esmaltada — a memória
  esmalte: '#14396E',
  esmalteFundo: '#0F2B54',
  esmalteClaro: '#3A6098',
  /** texto e moldura sobre a placa */
  sobreEsmalte: '#F4F3EE',
  /** texto secundário sobre a placa */
  sobreEsmalteDim: '#A8C2E4',

  // ferrugem — o tempo agindo sobre o esmalte
  ferrugem: '#B4471F',
  ferrugemClara: '#D4703F',
  /** texto sobre superfície de ferrugem */
  sobreFerrugem: '#F4F3EE',

  // conferido pela comunidade
  conferido: '#2E6E68',

  // texto sobre cal
  grafite: '#1A1D23',
  grafiteDim: '#55524B',

  /** "você está aqui" — neutro escuro de propósito: memória é azul, você não é memória */
  voce: '#1A1D23',

  // o mapa, em tons de cal
  mapaFundo: '#E4E1D6',
  mapaQuarteirao: '#DAD6C9',
  mapaRua: '#F1EFE8',
  mapaAvenida: '#F6F4EE',
  mapaAgua: '#B3CBC5',
} as const;

/** Sobreposições translúcidas recorrentes (chrome flutuante sobre mapa/câmera). */
export const alpha = {
  /** vidro claro sobre o mapa */
  glass: 'rgba(244,243,238,0.88)',
  /** vidro escuro sobre a câmera, onde o fundo é imprevisível */
  glassDark: 'rgba(15,43,84,0.86)',
  scrim: 'rgba(15,43,84,0.42)',
  /** chrome opaco sobre a câmera, onde o fundo é imprevisível */
  chrome: 'rgba(15,43,84,0.93)',
  /** véu que escurece capa de foto para o texto sobreviver por cima */
  veu: 'rgba(15,43,84,0.88)',
  /** tinta de ferrugem para fundo de estado conquistado */
  ferrugemTinta: 'rgba(180,71,31,0.10)',
} as const;

export type ColorToken = keyof typeof colors;
