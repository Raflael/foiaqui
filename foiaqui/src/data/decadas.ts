import type { Memory } from '@/types';

export interface Decada {
  /** ano de início: 1950, 1960… — é também o id */
  inicio: number;
  /** como aparece na régua: "50", "60", "00" */
  rotulo: string;
  /** como se fala: "Anos 50" */
  rotuloLongo: string;
  /** quantas memórias caem nela */
  total: number;
}

/** O ano de uma memória, ou null quando ela não tem data legível. */
export function anoDe(memory: Memory): number | null {
  const n = parseInt(memory.year, 10);
  return Number.isFinite(n) && n > 1000 ? n : null;
}

const inicioDaDecada = (ano: number) => Math.floor(ano / 10) * 10;

/**
 * "Anos 60" para o século XX, "Anos 2010" para o XXI.
 *
 * Dois dígitos sozinhos colidem: "Anos 10" é 1910 ou 2010? Com um acervo que
 * vai de 1865 até hoje isso não é hipótese, é a régua real do app. O século XX
 * fica na forma curta porque é como se fala; o XXI vai por extenso, que
 * também é como se fala.
 */
export const rotuloLongo = (inicio: number) =>
  inicio >= 2000 ? `Anos ${inicio}` : `Anos ${String(inicio).slice(2)}`;

/** Rótulo curto da régua: a virada de século aparece inteira, para ancorar. */
export const rotuloCurto = (inicio: number) =>
  inicio % 100 === 0 ? String(inicio) : String(inicio).slice(2);

/**
 * A linha do tempo do acervo (Decisão 11).
 *
 * A régua vai da década mais antiga até a mais recente e inclui as DÉCADAS
 * VAZIAS do meio. Isso é escolha, não descuido: um buraco na linha é a coisa
 * mais informativa que o mapa pode dizer. "Não há nada dos anos 80 aqui" não é
 * ausência de dado — é um convite, e é exatamente a preocupação que a PO
 * levantou sobre o banco vazio. Comprimir a régua só nas décadas que já têm
 * memória esconderia o que falta.
 *
 * O limite superior é a década atual mesmo que ninguém tenha registrado nada
 * nela: o presente também é passado de alguém.
 */
export function decadasDo(memorias: Memory[], hoje = new Date().getFullYear()): Decada[] {
  const anos = memorias.map(anoDe).filter((a): a is number => a !== null);

  const fim = inicioDaDecada(hoje);
  const inicio = anos.length ? Math.min(...anos.map(inicioDaDecada)) : fim - 30;

  const contagem = new Map<number, number>();
  for (const ano of anos) {
    const d = inicioDaDecada(ano);
    contagem.set(d, (contagem.get(d) ?? 0) + 1);
  }

  const out: Decada[] = [];
  for (let d = inicio; d <= fim; d += 10) {
    out.push({
      inicio: d,
      rotulo: rotuloCurto(d),
      rotuloLongo: rotuloLongo(d),
      total: contagem.get(d) ?? 0,
    });
  }
  return out;
}

/** A memória cai na década escolhida? Sem data, não cai em nenhuma. */
export function naDecada(memory: Memory, inicio: number | null): boolean {
  if (inicio === null) return true;
  const ano = anoDe(memory);
  return ano !== null && inicioDaDecada(ano) === inicio;
}

/** Quantas memórias ficam de fora de qualquer década por não terem data. */
export const semData = (memorias: Memory[]) =>
  memorias.filter((m) => anoDe(m) === null).length;
