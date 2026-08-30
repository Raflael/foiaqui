import type { ImageSource } from 'expo-image';

/**
 * A foto pode vir de dois mundos.
 *
 * O que a pessoa tira na rua chega como URI de arquivo; o que vem no acervo
 * semeado é empacotado com `require()`, que o Metro resolve para um número.
 * O `<Image>` aceita os dois, mas em formatos diferentes — e envolver o número
 * em `{ uri }` quebra silenciosamente, sem erro, com a imagem simplesmente não
 * aparecendo.
 */
export const fonteDaImagem = (v?: string | number): ImageSource | number | undefined =>
  typeof v === 'number' ? v : v ? { uri: v } : undefined;
