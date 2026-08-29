import type { Trail } from '@/types';

export const trails: Trail[] = [
  {
    id: 'centro',
    title: 'O centro que não existe mais',
    theme: 'Anos dourados',
    durationMin: 45,
    stopIds: ['cine', 'praca'],
    stopCount: 8,
    cover: { kind: 'sepia' },
  },
  {
    id: 'murais',
    title: 'Murais do bairro operário',
    theme: 'Arte urbana',
    durationMin: 30,
    stopIds: ['mural'],
    stopCount: 6,
    cover: { kind: 'gradient', colors: ['#2E6E68', '#1C4A45'] },
  },
  {
    id: 'praca-escola',
    title: 'Nossa praça, nossa gente',
    theme: 'Projeto escolar · 8º ano',
    durationMin: 25,
    stopIds: ['praca'],
    stopCount: 5,
    cover: { kind: 'gradient', colors: ['#7A4A8A', '#3C2148'] },
  },
];
