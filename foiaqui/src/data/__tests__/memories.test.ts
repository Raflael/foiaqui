import { eras, matchesQuery, memories, nomeCurto } from '@/data/memories';
import type { Memory } from '@/types';

const mem = (over: Partial<Memory> = {}): Memory =>
  ({
    id: 'x',
    title: 'Cine Marrocos',
    shortName: 'Cine',
    marker: 'Aqui funcionou',
    period: '1958 — 1974',
    year: '1958',
    era: 'Anos 50',
    place: 'Praça Afonso Pena, Centro',
    coords: { lat: 0, lng: 0 },
    story: 'a fila dobrava a esquina',
    author: { name: 'Dona Cecília', level: 3, role: 'Moradora' },
    kind: 'Foto + relato',
    verified: true,
    media: [],
    tags: ['Cinema', 'Anos dourados'],
    ...over,
  }) as Memory;

describe('matchesQuery', () => {
  it('busca vazia devolve tudo — não é o mesmo que não achar nada', () => {
    expect(matchesQuery(mem(), '')).toBe(true);
    expect(matchesQuery(mem(), '   ')).toBe(true);
  });

  it('acha por título, lugar, época, autor e tag', () => {
    expect(matchesQuery(mem(), 'marrocos')).toBe(true);
    expect(matchesQuery(mem(), 'afonso')).toBe(true);
    expect(matchesQuery(mem(), '1958')).toBe(true);
    expect(matchesQuery(mem(), 'cecilia')).toBe(true);
    expect(matchesQuery(mem(), 'cinema')).toBe(true);
  });

  /*
   * O normalize tira acento com NFD. Sem ele, "praca" não encontra "Praça" —
   * e ninguém digita cedilha no teclado do celular, na rua, com uma mão só.
   */
  it('ignora acento e caixa nos dois lados da comparação', () => {
    expect(matchesQuery(mem(), 'praca')).toBe(true);
    expect(matchesQuery(mem(), 'PRAÇA')).toBe(true);
    expect(matchesQuery(mem({ place: 'Praca sem acento' }), 'praça')).toBe(true);
    expect(matchesQuery(mem(), 'CeCíLiA')).toBe(true);
  });

  /*
   * Cada palavra digitada precisa aparecer. Se fosse "alguma palavra", digitar
   * mais termos ALARGARIA o resultado — o contrário do que a pessoa espera ao
   * refinar uma busca.
   */
  it('exige todos os termos, não qualquer um', () => {
    expect(matchesQuery(mem(), 'cine 1958')).toBe(true);
    expect(matchesQuery(mem(), 'xyz 1958')).toBe(false);
  });

  it('não acha o que não está lá', () => {
    expect(matchesQuery(mem(), 'padaria')).toBe(false);
  });
});

describe('nomeCurto', () => {
  it('sem endereço, ainda dá um nome — o pin nunca fica anônimo', () => {
    expect(nomeCurto(null)).toBe('Aqui');
    expect(nomeCurto(undefined)).toBe('Aqui');
    expect(nomeCurto('')).toBe('Aqui');
    expect(nomeCurto('   ')).toBe('Aqui');
  });

  it('fica com o trecho antes da vírgula', () => {
    expect(nomeCurto('Rua Sete de Setembro, 210')).not.toContain('210');
  });

  /*
   * "Avenida" sozinho não identifica nada: numa cidade toda rua é rua. Quando
   * o nome não cabe na chapa, o tipo de via é a primeira coisa a cair.
   */
  it('derruba o tipo de via quando o nome não cabe', () => {
    const curto = nomeCurto("Avenida Doutor Nelson d'Ávila");
    expect(curto.toLowerCase()).not.toContain('avenida');
    expect(curto).toContain('Doutor');
  });

  it('mantém o tipo de via quando o nome inteiro já cabe', () => {
    expect(nomeCurto('Rua do Comércio')).toBe('Rua do Comércio');
  });

  it('lida com abreviação com ponto', () => {
    expect(nomeCurto("Av. Doutor Nelson d'Ávila").toLowerCase()).not.toMatch(/^av\.?\s/);
  });

  it('nunca devolve vazio, nem quando uma palavra só já estoura o limite', () => {
    const saida = nomeCurto('Supercalifragilisticoexpialidoso');
    expect(saida.length).toBeGreaterThan(0);
    expect(saida.length).toBeLessThanOrEqual(18);
    expect(saida.endsWith('…')).toBe(true);
  });

  it('respeita o limite pedido', () => {
    expect(nomeCurto('Rua Sete de Setembro do Centro Histórico', 12).length).toBeLessThanOrEqual(12);
  });
});

describe('o acervo semeado', () => {
  /*
   * A lista de épocas é derivada do acervo, não escrita à mão. Já saiu de
   * sincronia uma vez: o filtro oferecia menos décadas do que o acervo tinha,
   * e memórias existentes ficavam inalcançáveis pelo filtro.
   */
  it('toda era do acervo aparece na lista de filtros', () => {
    const doAcervo = new Set(memories.map((m) => m.era));
    for (const era of doAcervo) expect(eras).toContain(era);
  });

  it('toda memória tem ano legível — é o que a Decisão 3 exige', () => {
    for (const m of memories) {
      expect(m.year).toMatch(/^\d{4}$/);
    }
  });

  it('nenhum id repetido', () => {
    const ids = memories.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('continuação sempre aponta para uma memória que existe', () => {
    const ids = new Set(memories.map((m) => m.id));
    for (const m of memories) {
      if (m.continuaEm) expect(ids.has(m.continuaEm)).toBe(true);
    }
  });

  it('a história nunca continua para trás no tempo', () => {
    for (const m of memories) {
      if (!m.continuaEm) continue;
      const proxima = memories.find((x) => x.id === m.continuaEm)!;
      expect(Number(proxima.year)).toBeGreaterThanOrEqual(Number(m.year));
    }
  });
});
