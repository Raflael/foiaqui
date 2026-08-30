import type { Position } from '@/data/location';

export interface FotoDoCommons {
  id: string;
  titulo: string;
  /** versão reduzida, para a lista */
  miniatura: string;
  /** arquivo em tamanho de uso */
  imagem: string;
  autor: string;
  licenca: string;
  /** o texto pronto para o campo de crédito da memória */
  credito: string;
  paginaUrl: string;
}

/**
 * Licenças que este app aceita importar.
 *
 * A lista é de permissão, não de bloqueio: o que não estiver aqui fica de
 * fora. O Commons hospeda material sob dezenas de rótulos, incluindo uso
 * restrito e "fair use" — e importar por engano uma foto que não pode ser
 * redistribuída transformaria o acervo num passivo. Diante da dúvida, some.
 */
const LICENCAS_OK = /^(cc0|cc[ -]by|public domain|pd-|no restrictions)/i;

const limpaHtml = (s?: string) =>
  (s ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Fotos com licença livre perto de um ponto, no Wikimedia Commons.
 *
 * Ataca o medo nº 1 da PO — o mapa vazio — pelo caminho mais barato que
 * existe: milhares de fotos de lugares brasileiros já estão catalogadas e
 * licenciadas, esperando alguém ligá-las à história do lugar. Quem vai contar
 * a memória do Mercado não precisa ter a foto; precisa saber que ela existe.
 *
 * A busca é por COORDENADA, não por texto, porque o produto inteiro pensa em
 * lugar: a pergunta certa é "o que já foi fotografado aqui?", não "o que se
 * chama Mercado?" — e o nome do arquivo raramente bate com o nome do lugar.
 */
export async function fotosPerto(
  de: Position,
  raioM = 800,
  limite = 20,
): Promise<FotoDoCommons[]> {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&generator=geosearch' +
    `&ggscoord=${de.lat}%7C${de.lng}&ggsradius=${raioM}&ggslimit=${limite}` +
    '&ggsnamespace=6&prop=imageinfo&iiprop=url%7Cextmetadata' +
    '&iiurlwidth=400&format=json&origin=*';

  const resposta = await fetch(url, {
    headers: { 'User-Agent': 'FoiAqui/1.0 (prototipo academico de memoria urbana)' },
  });
  if (!resposta.ok) throw new Error('commons ' + resposta.status);

  const json = (await resposta.json()) as {
    query?: { pages?: Record<string, unknown> };
  };
  const paginas = Object.values(json.query?.pages ?? {}) as {
    pageid?: number;
    title?: string;
    imageinfo?: {
      url?: string;
      thumburl?: string;
      descriptionurl?: string;
      extmetadata?: Record<string, { value?: string }>;
    }[];
  }[];

  return paginas
    .map((p) => {
      const info = p.imageinfo?.[0];
      const meta = info?.extmetadata ?? {};
      const licenca = limpaHtml(meta.LicenseShortName?.value) || 'sem licença declarada';
      const autor = limpaHtml(meta.Artist?.value) || 'autoria não declarada';
      const titulo = (p.title ?? '').replace(/^File:/, '').replace(/\.(jpe?g|png|webp)$/i, '');

      return {
        id: String(p.pageid ?? titulo),
        titulo,
        miniatura: info?.thumburl ?? info?.url ?? '',
        imagem: info?.url ?? '',
        autor,
        licenca,
        credito: `Foto: ${autor} · ${licenca} · Wikimedia Commons`,
        paginaUrl: info?.descriptionurl ?? '',
      };
    })
    .filter((f) => f.imagem && LICENCAS_OK.test(f.licenca));
}
