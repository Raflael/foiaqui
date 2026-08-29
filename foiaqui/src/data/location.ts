import type { Memory } from '@/types';

export interface Position {
  lat: number;
  lng: number;
}

/**
 * Posição usada quando o GPS não responde — permissão negada, sem sinal,
 * modo avião, emulador.
 *
 * Centro de Santos, perto das três memórias do acervo. Não é "posição falsa":
 * é o que permite o app abrir mostrando alguma coisa em vez de uma tela morta.
 * A interface diz claramente quando está usando isto (ver `useCurrentPosition`).
 */
export const fallbackPosition: Position = { lat: -23.934, lng: -46.3275 };

const EARTH_M = 6_371_000;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Distância em metros entre dois pontos (Haversine). */
export function distanceMeters(a: Position, b: Position): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.sqrt(h));
}

/** Metros até a memória, a partir de onde a pessoa está. */
export const distanceTo = (memory: Memory, from: Position) =>
  distanceMeters(from, memory.coords);

/** "aqui" · "120 m" · "1,4 km" — como a distância aparece na interface. */
export function formatDistance(meters: number): string {
  if (meters < 40) return 'aqui';
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

/** Raio de "perto de mim". Uma caminhada de poucos minutos. */
export const NEARBY_M = 300;
