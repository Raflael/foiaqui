import { pontoPor } from '@/data/pontos';
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
  /** quando todas as memórias do grupo são do mesmo ponto, o id dele */
  pontoId?: string;
}

/** Uma unidade posicionável antes de virar grupo na tela. */
interface Unidade {
  lat: number;
  lng: number;
  itens: Memory[];
  pontoId?: string;
}

/**
 * Junta memórias em pins.
 *
 * São duas junções, nesta ordem, e elas respondem perguntas diferentes.
 *
 * **Por ponto**, primeiro: memórias do mesmo lugar são um pin só em QUALQUER
 * zoom. Não é economia de espaço, é o modelo do produto — o Mercado Municipal
 * é um lugar, não duas histórias soltas que por acaso caíram no mesmo
 * endereço. Aproximar o mapa não deve estilhaçar um lugar em vários alfinetes.
 *
 * **Por pixel**, depois: pontos distintos que ficariam empilhados na tela
 * viram um agrupamento temporário, que se desfaz quando você aproxima. Aqui o
 * critério é pixel e não metro de propósito — a sobreposição depende do zoom,
 * não do terreno. O raio é largo porque a placa é larga (~110px); um cluster
 * calibrado para pontinho redondo deixaria as chapas empilhadas.
 */
export function agrupar(
  memorias: Memory[],
  regiao: Regiao,
  largura: number,
  altura: number,
  raioPx = 96,
): Grupo[] {
  // 1) o lugar como unidade
  const porPonto = new Map<string, Memory[]>();
  const unidades: Unidade[] = [];

  for (const m of memorias) {
    if (m.pontoId) {
      const lista = porPonto.get(m.pontoId);
      if (lista) lista.push(m);
      else porPonto.set(m.pontoId, [m]);
    } else {
      unidades.push({ lat: m.coords.lat, lng: m.coords.lng, itens: [m] });
    }
  }

  for (const [pontoId, itens] of porPonto) {
    const ponto = pontoPor(pontoId);
    unidades.push({
      // o ponto manda na posição: as memórias dele podem ter coordenada
      // ligeiramente diferente, e o lugar tem um endereço só
      lat: ponto?.coords.lat ?? itens[0].coords.lat,
      lng: ponto?.coords.lng ?? itens[0].coords.lng,
      itens: [...itens].sort((a, b) => (a.year > b.year ? 1 : -1)),
      pontoId,
    });
  }

  if (regiao.longitudeDelta <= 0 || regiao.latitudeDelta <= 0) {
    return unidades.map(({ lat, lng, itens, pontoId }) => ({ lat, lng, itens, pontoId }));
  }

  // 2) o que ficaria empilhado na tela
  const pxPorLng = largura / regiao.longitudeDelta;
  const pxPorLat = altura / regiao.latitudeDelta;
  const oeste = regiao.longitude - regiao.longitudeDelta / 2;
  const norte = regiao.latitude + regiao.latitudeDelta / 2;

  const grupos: { x: number; y: number; unidades: Unidade[] }[] = [];

  for (const u of unidades) {
    const x = (u.lng - oeste) * pxPorLng;
    const y = (norte - u.lat) * pxPorLat;

    const perto = grupos.find((g) => Math.hypot(g.x - x, g.y - y) < raioPx);
    if (perto) {
      perto.unidades.push(u);
      const n = perto.unidades.length;
      // o grupo passa a morar na média dos seus, para não puxar para o primeiro
      perto.x = (perto.x * (n - 1) + x) / n;
      perto.y = (perto.y * (n - 1) + y) / n;
    } else {
      grupos.push({ x, y, unidades: [u] });
    }
  }

  return grupos.map((g) => {
    const itens = g.unidades.flatMap((u) => u.itens);
    const pontos = new Set(g.unidades.map((u) => u.pontoId).filter(Boolean));
    return {
      lat: g.unidades.reduce((s, u) => s + u.lat, 0) / g.unidades.length,
      lng: g.unidades.reduce((s, u) => s + u.lng, 0) / g.unidades.length,
      itens,
      // só é "o ponto" se o grupo inteiro for dele e de mais ninguém
      pontoId:
        pontos.size === 1 && g.unidades.length === 1
          ? (g.unidades[0].pontoId ?? undefined)
          : undefined,
    };
  });
}
