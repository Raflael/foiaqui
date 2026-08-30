import { trails as semeadas } from '@/data/trails';
import { useColecoes } from '@/store/colecoes';
import type { Trail } from '@/types';

/**
 * As trilhas: as semeadas mais as que saem das suas coleções.
 *
 * A Decisão 10 põe a hierarquia em pino → coleção → roteiro, e o roteiro era
 * o único degrau que só o projeto podia criar. Mas uma coleção com três
 * lugares JÁ É um roteiro — só falta o app enxergar isso. Em vez de um
 * segundo editor com nome, capa e ordenação, a coleção vira trilha
 * diretamente: quem curou já fez o trabalho.
 *
 * O corte em duas paradas não é arbitrário: com uma só não há percurso, e
 * chamar de trilha o que é um pino sozinho quebraria a hierarquia da própria
 * decisão.
 */
const MINIMO_DE_PARADAS = 2;

/** Estimativa de caminhada: 12 min por parada, contando a parada em si. */
const MIN_POR_PARADA = 12;

export const useTrilhas = (): Trail[] => {
  const colecoes = useColecoes((s) => s.colecoes);

  const minhas: Trail[] = colecoes
    .filter((c) => c.memoriaIds.length >= MINIMO_DE_PARADAS)
    .map((c) => ({
      id: `col-trilha-${c.id}`,
      title: c.nome,
      theme: 'Sua coleção',
      durationMin: c.memoriaIds.length * MIN_POR_PARADA,
      stopIds: c.memoriaIds,
      // sem inflar: a trilha da pessoa tem exatamente as paradas que ela juntou
      stopCount: c.memoriaIds.length,
      cover: { kind: 'gradient', colors: ['#14396E', '#0F2B54'] },
      daPessoa: true,
    }));

  return [...minhas, ...semeadas];
};
