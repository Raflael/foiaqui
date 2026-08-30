import type { Badge } from '@/types';

/**
 * Quem está usando o app neste aparelho.
 *
 * Antes era a Íris Nogueira — persona da pesquisa — logada como se fosse a
 * dona do celular. Confundia dois papéis: a Íris é o arquétipo de quem
 * CONTRIBUI, e continua no acervo como autora de memórias. Quem usa é você.
 */
export const perfil = {
  nome: 'Rafael Vitor de Medeiros Costa',
  inicial: 'R',
  cidade: 'São José dos Campos',
};

/**
 * O nível vem do que a pessoa contribuiu de verdade.
 *
 * Decisão 12 da pesquisa: gamificar RECONHECIMENTO, nunca volume. Por isso os
 * degraus são poucos e largos, e o nome fala do papel — não de pontuação.
 * Não existe ranking, e não vai existir.
 */
const NIVEIS = [
  { minimo: 0, nivel: 1, titulo: 'Explorador' },
  { minimo: 1, nivel: 2, titulo: 'Contador de histórias' },
  { minimo: 5, nivel: 3, titulo: 'Guardião da memória' },
  { minimo: 15, nivel: 4, titulo: 'Cronista da cidade' },
] as const;

export const nivelPor = (memorias: number) =>
  [...NIVEIS].reverse().find((n) => memorias >= n.minimo) ?? NIVEIS[0];

/**
 * Conquistas derivadas do que existe, não de um mock.
 *
 * "Convidou amigos" saiu: não há como saber isso sem backend, e uma conquista
 * que nunca acende é pior que conquista nenhuma — ensina que o resto também
 * pode ser enfeite.
 */
export function conquistas(memorias: number, salvas: number): Badge[] {
  return [
    { id: 'primeira', label: 'Primeira memória', earned: memorias >= 1, icon: 'film' },
    { id: 'cinco', label: '5 memórias', earned: memorias >= 5, icon: 'shield' },
    { id: 'colecionador', label: '3 salvas', earned: salvas >= 3, icon: 'bookmark' },
    { id: 'quinze', label: '15 memórias', earned: memorias >= 15, icon: 'star' },
  ];
}
