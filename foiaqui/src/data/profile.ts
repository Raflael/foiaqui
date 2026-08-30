import type { Badge } from '@/types';

/*
 * A identidade de quem usa saiu daqui e virou `store/perfil.ts`.
 *
 * Era uma constante: o nome ficava gravado no fonte, e qualquer pessoa que
 * instalasse o app assinava como "Rafael". Num produto sobre autoria — cada
 * memória mostra quem contou — identidade fixa no código é mentira
 * estrutural. Este arquivo ficou só com o que é regra: níveis e conquistas.
 */

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
export function conquistas(memorias: number, salvas: number, revisoes = 0, trilhas = 0): Badge[] {
  return [
    { id: 'primeira', label: 'Primeira memória', earned: memorias >= 1, icon: 'film' },
    // andar a cidade é o uso que o produto mais quer ver acontecer
    { id: 'caminhante', label: 'Trilha a pé', earned: trilhas >= 1, icon: 'trail' },
    // revisar é contribuição tanto quanto enviar, e é a parte que ninguém
    // quer fazer — por isso ganha reconhecimento junto das outras
    { id: 'revisor', label: 'Primeira revisão', earned: revisoes >= 1, icon: 'shieldCheck' },
    { id: 'cinco', label: '5 memórias', earned: memorias >= 5, icon: 'shield' },
    { id: 'colecionador', label: '3 salvas', earned: salvas >= 3, icon: 'bookmark' },
    { id: 'quinze', label: '15 memórias', earned: memorias >= 15, icon: 'star' },
  ];
}
