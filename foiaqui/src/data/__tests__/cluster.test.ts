import { agrupar, type Regiao } from '@/data/cluster';
import { relativeAngle } from '@/data/location';
import { pontoPor } from '@/data/pontos';
import type { Memory } from '@/types';

const mem = (id: string, lat: number, lng: number, pontoId?: string, year = '1950'): Memory =>
  ({
    id,
    pontoId,
    title: id,
    shortName: id,
    marker: 'Aqui',
    period: year,
    year,
    era: '',
    place: '',
    coords: { lat, lng },
    story: '',
    author: { name: 'a', level: 1, role: 'r' },
    kind: '',
    verified: false,
    media: [],
    tags: [],
  }) as Memory;

/** Uma janela de mapa centrada em São José, com o zoom que o delta define. */
const regiao = (delta: number): Regiao => ({
  latitude: -23.18,
  longitude: -45.886,
  latitudeDelta: delta,
  longitudeDelta: delta,
});

const LARGURA = 400;
const ALTURA = 800;

describe('agrupar · o lugar como unidade', () => {
  /*
   * Esta é a regra do PRODUTO, não da tela: o Mercado Municipal é um lugar,
   * não duas histórias soltas que caíram no mesmo endereço. Aproximar o mapa
   * não pode estilhaçar um lugar em vários alfinetes — em nenhum zoom.
   */
  it('junta memórias do mesmo ponto num pin só, mesmo bem aproximado', () => {
    const memorias = [
      mem('a', -23.1807, -45.8859, 'mercado', '1923'),
      mem('b', -23.1808, -45.886, 'mercado', '1865'),
    ];
    const grupos = agrupar(memorias, regiao(0.0002), LARGURA, ALTURA);
    expect(grupos).toHaveLength(1);
    expect(grupos[0].itens).toHaveLength(2);
    expect(grupos[0].pontoId).toBe('mercado');
  });

  it('ordena as memórias do ponto pelo ano, da mais antiga para a mais nova', () => {
    const grupos = agrupar(
      [mem('novo', -23.1807, -45.8859, 'mercado', '1923'), mem('velho', -23.1807, -45.8859, 'mercado', '1865')],
      regiao(0.0002),
      LARGURA,
      ALTURA,
    );
    expect(grupos[0].itens.map((m) => m.year)).toEqual(['1865', '1923']);
  });

  it('usa a coordenada do PONTO, não a da primeira memória', () => {
    // as memórias de um lugar podem ter coordenadas ligeiramente diferentes,
    // mas o lugar tem um endereço só
    const oficial = pontoPor('mercado')!.coords;
    const grupos = agrupar(
      [mem('a', -23.9999, -45.9999, 'mercado')],
      regiao(1),
      LARGURA,
      ALTURA,
    );
    expect(grupos[0].lat).toBeCloseTo(oficial.lat, 4);
    expect(grupos[0].lng).toBeCloseTo(oficial.lng, 4);
  });

  it('memória sem ponto continua valendo — é o caso de lugar novo', () => {
    const grupos = agrupar([mem('solta', -23.5, -45.5)], regiao(1), LARGURA, ALTURA);
    expect(grupos).toHaveLength(1);
    expect(grupos[0].pontoId).toBeUndefined();
  });
});

describe('agrupar · o que ficaria empilhado na tela', () => {
  /*
   * O critério é PIXEL, não metro. Duas memórias a 30 m se sobrepõem com o
   * mapa afastado e ficam soltas com ele perto: raio em metros erraria em
   * quase todo zoom. É o mesmo par de pontos nos dois testes abaixo — só o
   * zoom muda.
   */
  const doisPontosProximos = [
    mem('m1', -23.1807, -45.8859, 'mercado'),
    mem('m2', -23.1802, -45.8879, 'matriz'),
  ];

  it('junta pontos distintos quando o mapa está afastado', () => {
    const grupos = agrupar(doisPontosProximos, regiao(0.5), LARGURA, ALTURA);
    expect(grupos).toHaveLength(1);
    expect(grupos[0].itens).toHaveLength(2);
  });

  it('separa os mesmos pontos quando o mapa aproxima', () => {
    const grupos = agrupar(doisPontosProximos, regiao(0.002), LARGURA, ALTURA);
    expect(grupos).toHaveLength(2);
  });

  it('não chama de "o ponto" um agrupamento de lugares diferentes', () => {
    // rotular o grupo com um pontoId faria a ficha abrir o lugar errado
    const grupos = agrupar(doisPontosProximos, regiao(0.5), LARGURA, ALTURA);
    expect(grupos[0].pontoId).toBeUndefined();
  });
});

describe('agrupar · casos de borda', () => {
  it('acervo vazio devolve lista vazia', () => {
    expect(agrupar([], regiao(0.01), LARGURA, ALTURA)).toEqual([]);
  });

  it('região degenerada não divide por zero nem some com as memórias', () => {
    // o mapa reporta delta 0 no primeiro quadro, antes de assentar
    const grupos = agrupar(
      [mem('a', -23.18, -45.88, 'mercado'), mem('b', -22, -45, 'matriz')],
      { latitude: 0, longitude: 0, latitudeDelta: 0, longitudeDelta: 0 },
      LARGURA,
      ALTURA,
    );
    expect(grupos).toHaveLength(2);
    expect(grupos.every((g) => Number.isFinite(g.lat) && Number.isFinite(g.lng))).toBe(true);
  });

  it('nenhuma memória se perde no caminho, em qualquer zoom', () => {
    const memorias = [
      mem('a', -23.1807, -45.8859, 'mercado'),
      mem('b', -23.1802, -45.8879, 'matriz'),
      mem('c', -23.1982, -45.897, 'vicentina'),
      mem('d', -23.3, -45.9),
    ];
    for (const delta of [0.0005, 0.005, 0.05, 0.5, 5]) {
      const total = agrupar(memorias, regiao(delta), LARGURA, ALTURA).flatMap((g) => g.itens);
      expect(total).toHaveLength(memorias.length);
      expect(new Set(total.map((m) => m.id)).size).toBe(memorias.length);
    }
  });
});

describe('relativeAngle · a virada do norte', () => {
  /*
   * A AR e a suavização da bússola dependem disto, e é onde uma implementação
   * ingênua quebra: entre 359° e 1° a diferença é 2°, não 358°. Errar aqui faz
   * a bússola apontar para o sul exatamente quando a pessoa olha para o norte.
   */
  it('atravessa o norte pelo menor arco', () => {
    expect(relativeAngle(1, 359)).toBe(2);
    expect(relativeAngle(359, 1)).toBe(-2);
    expect(relativeAngle(0, 350)).toBe(10);
    expect(relativeAngle(350, 0)).toBe(-10);
  });

  it('mantém o resultado sempre entre -180 e 180', () => {
    for (let b = 0; b < 360; b += 7) {
      for (let h = 0; h < 360; h += 11) {
        const a = relativeAngle(b, h);
        expect(a).toBeGreaterThan(-181);
        expect(a).toBeLessThanOrEqual(180);
      }
    }
  });

  it('mesma direção é zero', () => {
    expect(relativeAngle(90, 90)).toBe(0);
  });
});
