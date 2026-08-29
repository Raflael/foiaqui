/** Escala de espaçamento (múltiplos de 4, com os meios-passos que o layout usa). */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 26,
  gutter: 18,
} as const;

/**
 * Raios.
 *
 * Chapa esmaltada é cortada reta: o padrão do app passa a ser canto vivo
 * (`none`). Curva é exceção reservada ao que é corpo — avatar, botão de tocar
 * áudio — e à folha que sobe do rodapé, que precisa ler como superfície.
 */
export const radius = {
  none: 0,
  sm: 3,
  md: 4,
  sheet: 18,
  pill: 999,
} as const;

/**
 * Alvo mínimo de toque. A persona Íris tem 70 anos — isso não é negociável.
 * Use como `minWidth`/`minHeight` em tudo que for tocável.
 */
export const HIT = 44;

/** Altura da tab bar custom; telas somam isso no padding de baixo. */
export const TABBAR_HEIGHT = 84;

/** Espessura da moldura branca embutida — a assinatura da placa. */
export const FRAME = 2;
/** Recuo da moldura em relação à borda da chapa. */
export const FRAME_INSET = 7;
