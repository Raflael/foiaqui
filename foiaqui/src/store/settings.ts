import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { LARGE_TEXT_SCALE } from '@/theme';

interface SettingsState {
  /** "Fonte grande" — multiplica todo texto que passa por `src/components/Type.tsx`. */
  largeText: boolean;
  /** "Modo simples" — menos enfeite: sem animação, chrome mais opaco, menos densidade. */
  simpleMode: boolean;
  /** A dica da câmera no mapa já foi dispensada. */
  coachDismissed: boolean;
  toggleLargeText: () => void;
  toggleSimpleMode: () => void;
  dismissCoach: () => void;
}

/**
 * Preferências ficam no aparelho.
 *
 * Isso não contraria o "front-only" do CLAUDE.md — não é rede, é armazenamento
 * local. E é obrigatório: repetir a mesma dica toda sessão, ou perder o "fonte
 * grande" a cada abertura, é exatamente o tipo de coisa que faz a Íris desistir.
 *
 * A hidratação é assíncrona: o primeiro render usa os padrões e o valor salvo
 * chega logo depois. Para estes três booleanos isso é invisível.
 */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      largeText: false,
      simpleMode: false,
      coachDismissed: false,
      toggleLargeText: () => set((s) => ({ largeText: !s.largeText })),
      toggleSimpleMode: () => set((s) => ({ simpleMode: !s.simpleMode })),
      dismissCoach: () => set({ coachDismissed: true }),
    }),
    {
      name: 'foiaqui-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Fator a multiplicar em `fontSize`/`lineHeight`. 1 ou 1.25. */
export const useTypeScale = () =>
  useSettings((s) => (s.largeText ? LARGE_TEXT_SCALE : 1));
