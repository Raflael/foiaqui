import type { Trail } from '@/types';

/**
 * As trilhas: percursos a pé costurando pontos da cidade.
 *
 * Os roteiros mudaram junto com o acervo. Antes apontavam para memórias
 * inventadas ("Murais do bairro operário"); agora seguem a história real de
 * São José — o núcleo religioso do centro e a fase sanatorial, que é o
 * capítulo que mais marcou a cidade.
 *
 * `stopCount` é maior que `stopIds` de propósito: o roteiro tem mais paradas
 * do que o acervo já cobre, e a tela de trilha diz isso em voz alta em vez de
 * fingir que está completo. O buraco é o convite.
 */
export const trails: Trail[] = [
  {
    id: 'centro',
    title: 'O centro que rezava',
    theme: 'Do século XIX aos anos 30',
    durationMin: 40,
    stopIds: ['matriz-1934', 'benedito-1876', 'mercado-doacao'],
    stopCount: 6,
    cover: { kind: 'sepia' },
  },
  {
    id: 'sanatorial',
    title: 'A cidade que curava pelo ar',
    theme: 'Fase sanatorial · 1924–1952',
    durationMin: 35,
    stopIds: ['vicentina-1924', 'vicentina-clima'],
    stopCount: 7,
    cover: { kind: 'gradient', colors: ['#2E6E68', '#1C4A45'] },
  },
  {
    id: 'mercado-escola',
    title: 'Cem anos de mercado',
    theme: 'Projeto escolar · 8º ano',
    durationMin: 25,
    stopIds: ['mercado-doacao', 'mercado-1923'],
    stopCount: 4,
    cover: { kind: 'gradient', colors: ['#7A4A8A', '#3C2148'] },
  },
];
