import { agrupar, type Regiao } from '@/data/cluster';
import type { Memory } from '@/types';

export interface Mancha {
  lat: number;
  lng: number;
  /** quantas memórias sustentam esta mancha */
  peso: number;
  /** raio em metros, proporcional ao peso */
  raioM: number;
}

/**
 * O calor da memória: onde a cidade lembra muito, onde lembra pouco.
 *
 * Reaproveita o agrupamento que o mapa já faz, em vez de um algoritmo
 * separado: as manchas nascem exatamente nos mesmos grupos que os pins, então
 * o que a pessoa vê aceso é o que ela consegue tocar. Um mapa de calor com
 * geometria própria acenderia áreas sem pin correspondente, e isso mente.
 *
 * O raio cresce com a raiz do peso, não linearmente — dobrar as memórias não
 * pode dobrar o raio, senão um lugar com dez histórias engoliria o quarteirão
 * inteiro e apagaria os vizinhos que têm uma. É a mesma razão pela qual mapas
 * de bolha sérios escalam por área e não por diâmetro.
 */
export function manchas(
  memorias: Memory[],
  regiao: Regiao,
  largura: number,
  altura: number,
): Mancha[] {
  // raio maior que o do pin: o calor é atmosfera, não alvo
  const grupos = agrupar(memorias, regiao, largura, altura, 130);

  // metros por pixel na latitude corrente, para a mancha ter tamanho de tela
  // coerente em qualquer zoom
  const metrosPorPixel = (regiao.latitudeDelta * 111_320) / Math.max(altura, 1);

  return grupos.map((g) => ({
    lat: g.lat,
    lng: g.lng,
    peso: g.itens.length,
    raioM: Math.max(60, Math.sqrt(g.itens.length) * 52 * metrosPorPixel),
  }));
}
