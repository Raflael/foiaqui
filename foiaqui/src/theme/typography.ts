/**
 * Quatro vozes tipográficas, uma por papel — direção "Placa Esmaltada".
 *
 *   plaque — Archivo Narrow, caixa alta. É a letra fundida da placa: condensada
 *            porque nome de rua precisa caber em chapa estreita.
 *   story  — Newsreader. A voz de quem viveu; serifa de leitura, não de enfeite.
 *   ui     — Archivo. Grotesca legível para a interface.
 *   mono   — DM Mono. Datas, anos, coordenadas, número de acervo.
 *
 * Cada família vem em arquivo separado por peso: `fontWeight` NÃO funciona.
 * Escolha a família certa.
 */
export const fonts = {
  plaque: {
    semibold: 'ArchivoNarrow_600SemiBold',
    bold: 'ArchivoNarrow_700Bold',
  },
  story: {
    regular: 'Newsreader_400Regular',
    semibold: 'Newsreader_600SemiBold',
  },
  ui: {
    regular: 'Archivo_400Regular',
    semibold: 'Archivo_600SemiBold',
  },
  mono: {
    regular: 'DMMono_400Regular',
  },
} as const;

export type PlaqueWeight = keyof typeof fonts.plaque;
export type UIWeight = keyof typeof fonts.ui;
export type StoryWeight = keyof typeof fonts.story;

/** Escala de tamanhos. Os componentes de texto multiplicam isso pelo "fonte grande". */
export const size = {
  micro: 10.5,
  eyebrow: 11,
  caption: 11.5,
  small: 12.5,
  body: 14,
  bodyLg: 15.5,
  story: 17,
  title: 17,
  h2: 21,
  h1: 26,
  plaque: 32,
} as const;

/** Multiplicador aplicado quando "fonte grande" está ligado no perfil. */
export const LARGE_TEXT_SCALE = 1.25;

/** Espaçamento entre letras da placa — chapa esmaltada tem tracking generoso. */
export const PLAQUE_TRACKING = 0.3;
