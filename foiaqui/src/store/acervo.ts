import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { filaSemeada } from '@/data/fila';
import { memories as seed } from '@/data/memories';
import { useAprovadas } from '@/store/moderacao';
import type { Memory } from '@/types';

interface AcervoState {
  /** memórias criadas pela pessoa neste aparelho */
  criadas: Memory[];
  adicionar: (memory: Memory) => void;
  remover: (id: string) => void;
}

/**
 * O que a pessoa criou fica guardado no aparelho.
 *
 * Antes o "Enviar memória" era um `setTimeout` que mostrava a mensagem de
 * moderação e jogava tudo fora — a pessoa recebia "Memória enviada" e nada
 * acontecia. Isso é mentira de interface, e mentira de interface ensina a
 * desconfiar do produto inteiro.
 *
 * Não há backend ainda, então "enviar" significa guardar aqui. A memória
 * nasce `em_revisao`: quem enviou vê a própria no mapa, marcada, mas ela
 * ainda não foi conferida pela comunidade (Decisão 5). Quando o backend
 * entrar, este store vira a fila de envio offline.
 */
export const useAcervo = create<AcervoState>()(
  persist(
    (set) => ({
      criadas: [],
      adicionar: (memory) => set((s) => ({ criadas: [memory, ...s.criadas] })),
      remover: (id) => set((s) => ({ criadas: s.criadas.filter((m) => m.id !== id) })),
    }),
    {
      name: 'foiaqui-acervo',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/**
 * Tudo que existe no mapa: o acervo semente, o que você criou e o que você
 * APROVOU na fila de revisão.
 *
 * Memória em revisão de outra pessoa não entra: ela ainda não é pública, e
 * mostrá-la no mapa antes do parecer esvaziaria o sentido da moderação. A sua
 * própria entra mesmo em revisão — marcada —, porque quem enviou precisa ver
 * onde ela caiu para poder corrigir.
 */
export const useMemorias = (): Memory[] => {
  const criadas = useAcervo((s) => s.criadas);
  const aprovadas = useAprovadas();
  if (!criadas.length && !aprovadas.length) return seed;
  return [...criadas, ...aprovadas, ...seed];
};

/** Uma memória pelo id, de qualquer origem — inclusive a que está na fila. */
export const useMemoria = (id?: string | null): Memory | undefined => {
  const criadas = useAcervo((s) => s.criadas);
  if (!id) return undefined;
  return (
    criadas.find((m) => m.id === id) ??
    seed.find((m) => m.id === id) ??
    filaSemeada.find((m) => m.id === id)
  );
};
