import type { Memory } from '@/types';

/**
 * As suas memórias como GeoJSON.
 *
 * Preservação é a missão do produto, e dado preso trai a missão: o que você
 * contou é SEU, e sair do app com ele tem que ser um toque — não um pedido de
 * suporte. GeoJSON porque é o formato aberto que qualquer mapa entende
 * (QGIS, Google Earth, umap.openstreetmap.fr), então o backup já nasce útil,
 * não só guardável.
 *
 * Vai o texto e os metadados. As mídias ficam de fora com aviso: os arquivos
 * moram no armazenamento do app e um JSON com fotos em base64 seria um
 * monstro de dezenas de MB que nenhum aplicativo de destino aceitaria bem.
 */
export function geojsonDasMemorias(memorias: Memory[]): string {
  const colecao = {
    type: 'FeatureCollection' as const,
    features: memorias.map((m) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [m.coords.lng, m.coords.lat] },
      properties: {
        titulo: m.title,
        marcador: m.marker,
        periodo: m.period,
        ano: m.year,
        lugar: m.place,
        relato: m.story,
        autor: m.author.name,
        tags: m.tags,
        status: m.status ?? 'publicada',
        app: 'FoiAqui',
      },
    })),
  };
  return JSON.stringify(colecao, null, 2);
}
