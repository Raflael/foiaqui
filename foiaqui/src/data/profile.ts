import type { UserProfile } from '@/types';

export const profile: UserProfile = {
  name: 'Íris Nogueira',
  initial: 'Í',
  level: 4,
  city: 'Santos-SP',
  role: 'Guardiã da Memória',
  stats: { memories: 27, views: 1400, collections: 3 },
  badges: [
    { id: 'first', label: 'Primeira foto', earned: true, icon: 'film' },
    { id: 'ten', label: '10 memórias', earned: true, icon: 'shield' },
    { id: 'invite', label: 'Convidou amigos', earned: true, icon: 'user' },
    { id: 'trail', label: 'Trilha própria', earned: false, icon: 'star' },
  ],
  moderationQueue: 4,
};

/** 1400 → "1,4k". Português usa vírgula decimal. */
export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k.toFixed(1).replace('.', ',').replace(',0', '')}k`;
}
