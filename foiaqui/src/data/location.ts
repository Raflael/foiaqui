import type { Memory } from '@/types';

export interface Position {
  lat: number;
  lng: number;
}

/**
 * Posição usada quando o GPS não responde — permissão negada, sem sinal,
 * modo avião, emulador.
 *
 * Centro de São José dos Campos, perto das três memórias do acervo. Não é "posição falsa":
 * é o que permite o app abrir mostrando alguma coisa em vez de uma tela morta.
 * A interface diz claramente quando está usando isto (ver `useCurrentPosition`).
 */
export const fallbackPosition: Position = { lat: -23.1801, lng: -45.8864 };

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

/**
 * Azimute em graus (0 = norte, 90 = leste) de `from` para `to`.
 *
 * É o que permite saber PARA ONDE uma memória fica a partir de onde você está.
 * Cruzando isso com a bússola do celular, dá para posicionar a memória na tela
 * conforme o lado que a câmera aponta.
 */
export function bearingTo(from: Position, to: Position): number {
  const f1 = rad(from.lat);
  const f2 = rad(to.lat);
  const dLng = rad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(f2);
  const x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/**
 * Diferença entre o azimute de um alvo e para onde a câmera aponta,
 * normalizada em [-180, 180]. Negativo = está à sua esquerda.
 */
export const relativeAngle = (bearing: number, heading: number) =>
  ((bearing - heading + 540) % 360) - 180;

/** Campo de visão horizontal aproximado da câmera traseira de um celular. */
export const CAMERA_FOV = 62;
