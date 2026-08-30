import type { Memory } from '@/types';

export interface Regiao {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface Grupo {
  /** centro geográfico do grupo */
  lat: number;
  lng: number;
  itens: Memory[];
}

/**
 * Agrupa memórias que ficariam empilhadas na tela.
 *
 * O critério é distância em PIXELS, não em metros: duas memórias a 30 m uma da
 * outra se sobrepõem com o mapa afastado e ficam bem separadas com ele perto.
 * Agrupar por metros daria um raio errado em quase todo nível de zoom.
 *
 * O raio é largo porque a placa esmaltada é larga — um marcador de ~110 px
 * precisa de mais folga que um pontinho redondo.
 */
export function agrupar(
  memorias: Memory[],
  regiao: Regiao,
  largura: number,
  altura: number,
  raioPx = 96,
): Grupo[] {
  if (regiao.longitudeDelta <= 0 || regiao.latitudeDelta <= 0) {
    return memorias.map((m) => ({ lat: m.coords.lat, lng: m.coords.lng, itens: [m] }));
  }

  const pxPorLng = largura / regiao.longitudeDelta;
  const pxPorLat = altura / regiao.latitudeDelta;
  const oeste = regiao.longitude - regiao.longitudeDelta / 2;
  const norte = regiao.latitude + regiao.latitudeDelta / 2;

  const grupos: { x: number; y: number; itens: Memory[] }[] = [];

  for (const m of memorias) {
    const x = (m.coords.lng - oeste) * pxPorLng;
    const y = (norte - m.coords.lat) * pxPorLat;

    const perto = grupos.find((g) => Math.hypot(g.x - x, g.y - y) < raioPx);
    if (perto) {
      perto.itens.push(m);
      // o grupo passa a morar na média dos seus, para não puxar para o primeiro
      perto.x = (perto.x * (perto.itens.length - 1) + x) / perto.itens.length;
      perto.y = (perto.y * (perto.itens.length - 1) + y) / perto.itens.length;
    } else {
      grupos.push({ x, y, itens: [m] });
    }
  }

  return grupos.map((g) => ({
    lat: g.itens.reduce((s, m) => s + m.coords.lat, 0) / g.itens.length,
    lng: g.itens.reduce((s, m) => s + m.coords.lng, 0) / g.itens.length,
    itens: g.itens,
  }));
}
