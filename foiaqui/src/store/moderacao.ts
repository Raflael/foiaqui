import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { filaSemeada } from '@/data/fila';
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

interface ModeracaoState {
  pareceres: Parecer[];
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
      pulados: [],
      registrar: (parecer) =>
        set((s) => ({
          pareceres: [parecer, ...s.pareceres.filter((p) => p.memoriaId !== parecer.memoriaId)],
          pulados: s.pulados.filter((id) => id !== parecer.memoriaId),
        })),
      pular: (memoriaId) =>
        set((s) => ({
          pulados: s.pulados.includes(memoriaId) ? s.pulados : [...s.pulados, memoriaId],
        })),
      reabrir: () => set({ pareceres: [], pulados: [] }),
    }),
    {
      name: 'foiaqui-moderacao',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** É sua? Não se revisa a própria memória. */
const minha = (m: Memory) => m.author.name === perfil.nome;

/** O que ainda espera parecer seu. */
export const useFila = (): Memory[] => {
  const pareceres = useModeracao((s) => s.pareceres);
  const pulados = useModeracao((s) => s.pulados);
  const decididas = new Set(pareceres.map((p) => p.memoriaId));
  return filaSemeada.filter(
    (m) => !minha(m) && !decididas.has(m.id) && !pulados.includes(m.id),
  );
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

/** O parecer dado a uma memória, se houver. */
export const useParecer = (id?: string | null) =>
  useModeracao((s) => (id ? s.pareceres.find((p) => p.memoriaId === id) : undefined));
