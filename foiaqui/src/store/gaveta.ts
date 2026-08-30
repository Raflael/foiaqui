import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Rascunho } from '@/store/rascunho';

export interface RascunhoGuardado extends Rascunho {
  id: string;
  /** como ele aparece na lista: o começo do relato, ou o lugar */
  titulo: string;
  quando: number;
}

interface GavetaState {
  rascunhos: RascunhoGuardado[];
  guardar: (r: Rascunho, titulo: string) => void;
  descartar: (id: string) => void;
}

/**
 * A gaveta de rascunhos.
 *
 * O rascunho automático resolve "perdi o app no meio"; a gaveta resolve outra
 * coisa: a pessoa está no Mercado, lembra de UMA memória enquanto escreve
 * outra, e hoje precisa escolher qual perder. Memória chama memória — é o
 * comportamento mais previsível deste produto, e o formulário de um slot
 * transformava isso em prejuízo.
 *
 * O título sai do começo do relato, não de um campo novo: pedir para nomear
 * um rascunho é cobrar trabalho de organização de quem ainda está tentando
 * lembrar. Sem relato, cai no lugar; sem lugar, na data.
 */
export const useGaveta = create<GavetaState>()(
  persist(
    (set) => ({
      rascunhos: [],
      guardar: (r, titulo) =>
        set((s) => ({
          rascunhos: [
            { ...r, id: `rasc-${Date.now()}`, titulo, quando: Date.now() },
            ...s.rascunhos,
          ],
        })),
      descartar: (id) =>
        set((s) => ({ rascunhos: s.rascunhos.filter((r) => r.id !== id) })),
    }),
    {
      name: 'foiaqui-gaveta',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** O nome que a lista mostra, na ordem do que a pessoa já escreveu. */
export const tituloDoRascunho = (r: Rascunho): string => {
  const relato = r.story.trim();
  if (relato) return relato.slice(0, 48) + (relato.length > 48 ? '…' : '');
  if (r.era) return `Rascunho de ${r.era.toLowerCase()}`;
  return 'Rascunho sem título';
};
