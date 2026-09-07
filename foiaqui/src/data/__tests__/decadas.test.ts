import { ANTES, anoDe, decadasDo, eraDoAno, naDecada, rotuloLongo, semData } from '@/data/decadas';
import type { Memory } from '@/types';

/** Memória mínima: só o que a função sob teste realmente lê. */
const mem = (year: string): Memory =>
  ({
    id: 'x' + year,
    title: 't',
    shortName: 't',
    marker: 'Aqui',
    period: year,
    year,
    era: '',
    place: '',
    coords: { lat: 0, lng: 0 },
    story: '',
    author: { name: 'a', level: 1, role: 'r' },
    kind: '',
    verified: false,
    media: [],
    tags: [],
  }) as Memory;

describe('rotuloLongo', () => {
  /*
   * A regra existe por causa de uma colisão real: o acervo vai de 1865 a 2021,
   * e "Anos 10" pode ser 1910 ou 2010. Não é hipótese — é a régua do app.
   */
  it('usa a forma curta no século XX', () => {
    expect(rotuloLongo(1960)).toBe('Anos 60');
    expect(rotuloLongo(1900)).toBe('Anos 00');
  });

  it('escreve o século XXI por extenso, para não colidir com o XX', () => {
    expect(rotuloLongo(2010)).toBe('Anos 2010');
    expect(rotuloLongo(2000)).toBe('Anos 2000');
    expect(rotuloLongo(2010)).not.toBe(rotuloLongo(1910));
  });
});

describe('anoDe', () => {
  it('lê o ano quando ele é um ano', () => {
    expect(anoDe(mem('1958'))).toBe(1958);
  });

  it('devolve null para o que não é data — e não NaN', () => {
    // NaN passaria adiante e envenenaria Math.min na régua inteira
    expect(anoDe(mem(''))).toBeNull();
    expect(anoDe(mem('anos 50'))).toBeNull();
    expect(anoDe(mem('58'))).toBeNull();
  });
});

describe('decadasDo', () => {
  /*
   * A décadas vazias no meio são DECISÃO, não descuido (Decisão 11): o buraco
   * na régua é a informação mais útil que o mapa dá — "não há nada dos anos 80
   * aqui" é um convite. Comprimir a régua nas décadas povoadas apagaria isso,
   * e é exatamente o atalho que alguém tentaria tomar "otimizando" a função.
   */
  it('inclui as décadas vazias entre a mais antiga e hoje', () => {
    const regua = decadasDo([mem('1955'), mem('1962')], 1985);
    expect(regua.map((d) => d.inicio)).toEqual([1950, 1960, 1970, 1980]);
    expect(regua.find((d) => d.inicio === 1970)?.total).toBe(0);
  });

  it('conta quantas caem em cada década', () => {
    const regua = decadasDo([mem('1955'), mem('1958'), mem('1962')], 1965);
    expect(regua.find((d) => d.inicio === 1950)?.total).toBe(2);
    expect(regua.find((d) => d.inicio === 1960)?.total).toBe(1);
  });

  it('vai até a década atual mesmo sem nada nela — o presente é passado de alguém', () => {
    const regua = decadasDo([mem('2001')], 2026);
    expect(regua.at(-1)?.inicio).toBe(2020);
    expect(regua.at(-1)?.total).toBe(0);
  });

  it('não quebra com acervo vazio', () => {
    const regua = decadasDo([], 2026);
    expect(regua.length).toBeGreaterThan(0);
    expect(regua.at(-1)?.inicio).toBe(2020);
  });

  it('ignora memórias sem data em vez de estourar a régua', () => {
    // com NaN no meio, Math.min devolveria NaN e o laço não rodaria nenhuma vez
    const regua = decadasDo([mem('1990'), mem('sem data')], 2010);
    expect(regua.map((d) => d.inicio)).toEqual([1990, 2000, 2010]);
  });
});

describe('naDecada e semData', () => {
  it('sem década escolhida, tudo passa', () => {
    expect(naDecada(mem('1958'), null)).toBe(true);
    expect(naDecada(mem('sem data'), null)).toBe(true);
  });

  it('memória sem data não cai em década nenhuma', () => {
    expect(naDecada(mem('sem data'), 1950)).toBe(false);
  });

  it('conta as que ficariam invisíveis na linha do tempo', () => {
    expect(semData([mem('1958'), mem('x'), mem('')])).toBe(2);
  });
});

describe('eraDoAno', () => {
  /*
   * A colisão que este teste tranca é real e passou despercebida: gerar a era
   * chamando rotuloLongo direto rotulava 1876 como "Anos 70" — o mesmo de 1970.
   */
  it('joga tudo anterior a 1900 no balde, sem inventar década', () => {
    expect(eraDoAno(1865)).toBe(ANTES);
    expect(eraDoAno(1876)).toBe(ANTES);
    expect(eraDoAno(1899)).toBe(ANTES);
    expect(eraDoAno(1876)).not.toBe(eraDoAno(1976));
  });

  it('a partir de 1900 devolve a década', () => {
    expect(eraDoAno(1900)).toBe('Anos 00');
    expect(eraDoAno(1958)).toBe('Anos 50');
    expect(eraDoAno(2021)).toBe('Anos 2020');
  });
});
