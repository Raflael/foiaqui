import type { IconName } from '@/components/Icon';

/**
 * Os critérios públicos de revisão (Decisão 5).
 *
 * "Públicos" é a palavra que importa. O benchmarking apontou o problema do
 * Google Maps: a moderação é rápida e opaca, e o autor raramente entende por
 * que algo foi removido. O modelo copiado aqui é o do Niantic Wayfarer —
 * submissão, revisão por pares, critérios que qualquer um pode ler antes de
 * enviar, e recusa que diz o motivo.
 *
 * Por isso a mesma lista aparece em dois lugares: para quem revisa, como
 * régua; e para quem envia, como aviso do que vai ser cobrado. Uma regra que
 * só o revisor conhece é uma armadilha, não um critério.
 *
 * São quatro, e são poucos de propósito: critério que ninguém lembra não é
 * aplicado, é inventado na hora.
 */
export interface Criterio {
  id: string;
  icon: IconName;
  /** o que o revisor pergunta */
  pergunta: string;
  /** o que conta como sim */
  explicacao: string;
  /** como a recusa aparece para quem enviou — em segunda pessoa, sem jargão */
  recusa: string;
}

export const criterios: Criterio[] = [
  {
    id: 'lugar',
    icon: 'pinSolid',
    pergunta: 'Aconteceu neste lugar?',
    explicacao:
      'A memória tem que ser do ponto marcado, não do bairro nem da cidade em geral. Se o relato fala de outro endereço, o pin está errado.',
    recusa: 'A história parece ser de outro lugar — o pin não bate com o relato.',
  },
  {
    id: 'checavel',
    icon: 'timeline',
    pergunta: 'Dá para saber quando foi?',
    explicacao:
      'Precisa de data ou época, e de uma âncora: uma foto, um documento, ou alguém que viveu aquilo. Boato sem origem não vira acervo.',
    recusa: 'Falta como checar: sem data ou sem quem viu, não dá para confirmar.',
  },
  {
    id: 'respeito',
    icon: 'shield',
    pergunta: 'Respeita quem aparece?',
    explicacao:
      'Sem expor pessoa privada, sem ofensa, sem acusação. Memória de um lugar não é denúncia sobre gente que ainda mora nele.',
    recusa: 'Expõe ou ofende alguém — memória de lugar não é denúncia sobre pessoas.',
  },
  {
    id: 'memoria',
    icon: 'film',
    pergunta: 'É memória, e não anúncio?',
    explicacao:
      'O FoiAqui conta o que aconteceu, não recomenda o que existe hoje. Divulgação de negócio, mesmo antigo e querido, é propaganda.',
    recusa: 'Isto é divulgação de um negócio de hoje, não memória do lugar.',
  },
];

export const criterioPor = (id?: string | null) => criterios.find((c) => c.id === id);
