import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { filaSemeada } from '@/data/fila';
import { memories as seed } from '@/data/memories';
import { perfil } from '@/data/profile';
import type { Memory } from '@/types';

export type Decisao = 'aprovada' | 'recusada';

export interface Parecer {
  memoriaId: string;
  decisao: Decisao;
  /** qual critério reprovou — obrigatório na recusa, é o que a torna justificada */
  criterioId?: string;
  /** recado opcional para quem enviou */
  nota?: string;
  quando: number;
}

export interface Denuncia {
  memoriaId: string;
  criterioId: string;
  nota?: string;
  quando: number;
}

interface ModeracaoState {
  pareceres: Parecer[];
  /**
   * Denúncias de memórias JÁ publicadas.
   *
   * A revisão pega o que entra; a denúncia pega o que passou. Sem ela a
   * moderação só olha para frente, e conteúdo problemático que escapou de um
   * parecer fica publicado para sempre. É a mesma exigência da recusa: quem
   * denuncia aponta qual critério foi ferido, para o relato chegar a quem
   * revisa já dizendo o que olhar.
   */
  denuncias: Denuncia[];
  denunciar: (denuncia: Denuncia) => void;
  /** "não sei julgar": sai da fila sem virar decisão */
  pulados: string[];
  registrar: (parecer: Parecer) => void;
  pular: (memoriaId: string) => void;
  /** devolve tudo para a fila — para testar o fluxo de novo */
  reabrir: () => void;
}

/**
 * A revisão por pares (Decisão 5).
 *
 * O modelo é o do Niantic Wayfarer, que o benchmarking apontou como a curadoria
 * comunitária mais bem documentada em escala: envio → revisão por pares →
 * critérios públicos → recusa justificada. O contra-exemplo é o Google Maps,
 * "rápido, mas opaco: o autor raramente entende por que algo foi removido".
 * Por isso recusa aqui EXIGE apontar um critério — a interface não deixa
 * recusar sem dizer o motivo, e o motivo é escrito para quem enviou ler.
 *
 * Três regras que valem código:
 *
 * 1. Você não revisa a si mesmo. Óbvio de dizer, fácil de esquecer, e sem isso
 *    a moderação vira carimbo.
 * 2. Pular não é decidir. Quem não conhece o lugar precisa poder passar sem
 *    inventar um parecer; forçar decisão produz decisão ruim.
 * 3. Aprovar tem consequência visível: a memória aprovada aparece no mapa.
 *    Revisão que não muda nada na tela não é revisão, é formulário.
 *
 * O que este protótipo AINDA NÃO faz, e é honesto dizer: uma revisão só já
 * publica. Em produção seriam N pareceres concordantes de revisores distintos,
 * com reputação de quem revisa — impossível num aparelho só, porque não há
 * outras pessoas.
 */
export const useModeracao = create<ModeracaoState>()(
  persist(
    (set) => ({
      pareceres: [],
      denuncias: [],
      pulados: [],
      denunciar: (denuncia) =>
        set((s) => ({
          denuncias: [denuncia, ...s.denuncias.filter((d) => d.memoriaId !== denuncia.memoriaId)],
        })),
      registrar: (parecer) =>
        set((s) => ({
          pareceres: [parecer, ...s.pareceres.filter((p) => p.memoriaId !== parecer.memoriaId)],
          pulados: s.pulados.filter((id) => id !== parecer.memoriaId),
        })),
      pular: (memoriaId) =>
        set((s) => ({
          pulados: s.pulados.includes(memoriaId) ? s.pulados : [...s.pulados, memoriaId],
        })),
      reabrir: () => set({ pareceres: [], pulados: [], denuncias: [] }),
    }),
    {
      name: 'foiaqui-moderacao',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** É sua? Não se revisa a própria memória. */
const minha = (m: Memory) => m.author.name === perfil.nome;

/**
 * O que espera parecer seu: o que nunca foi revisado, e o que foi DENUNCIADO
 * depois de publicado.
 *
 * A denúncia precisa ter consequência visível, senão o botão "Reportar" é
 * teatro: a memória volta para a fila com o apontamento junto. Um parecer
 * anterior à denúncia não conta — foi dado antes de alguém ver o problema.
 */
export const useFila = (): Memory[] => {
  const pareceres = useModeracao((s) => s.pareceres);
  const denuncias = useModeracao((s) => s.denuncias);
  const pulados = useModeracao((s) => s.pulados);

  const parecerDe = new Map(pareceres.map((p) => [p.memoriaId, p]));
  const pendente = (m: Memory, desde = 0) => {
    if (minha(m) || pulados.includes(m.id)) return false;
    const p = parecerDe.get(m.id);
    return !p || p.quando < desde;
  };

  const naFila = filaSemeada.filter((m) => pendente(m));

  const denunciadas = denuncias
    .map((d) => {
      const m = seed.find((x) => x.id === d.memoriaId) ?? filaSemeada.find((x) => x.id === d.memoriaId);
      return m && pendente(m, d.quando) ? m : null;
    })
    .filter((m): m is Memory => m !== null);

  // denúncia na frente: é conteúdo já visível para todo mundo
  return [...denunciadas, ...naFila];
};

/** As que você aprovou — elas passam a existir no mapa. */
export const useAprovadas = (): Memory[] => {
  const pareceres = useModeracao((s) => s.pareceres);
  const sim = new Set(
    pareceres.filter((p) => p.decisao === 'aprovada').map((p) => p.memoriaId),
  );
  return filaSemeada
    .filter((m) => sim.has(m.id))
    .map((m) => ({ ...m, status: 'publicada' as const }));
};

/** Quantas você já revisou — vira reconhecimento no perfil, nunca ranking. */
export const useRevisoes = () => useModeracao((s) => s.pareceres.length);

/** Esta memória foi denunciada? */
export const useDenuncia = (id?: string | null) =>
  useModeracao((s) => (id ? s.denuncias.find((d) => d.memoriaId === id) : undefined));

/** O parecer dado a uma memória, se houver. */
export const useParecer = (id?: string | null) =>
  useModeracao((s) => (id ? s.pareceres.find((p) => p.memoriaId === id) : undefined));
