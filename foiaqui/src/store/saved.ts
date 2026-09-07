import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SavedState {
  /** ids de Memory salvos, na ordem em que foram salvos (mais recente primeiro) */
  ids: string[];
  toggle: (id: string) => void;
}

/**
 * O que a pessoa salvou.
 *
 * Persistido, e isso não é detalhe: salvar é a promessa de "guardei para
 * depois". Um marcador que some ao fechar o app não guarda nada — quebra
 * justamente a expectativa que o ícone cria.
 *
 * A lista começa VAZIA. Ela vinha semeada com três ids do mock antigo
 * ('cine', 'praca', 'mural') que sumiram quando o acervo virou os pontos
 * reais de São José. Como a tela de Salvos descarta id que não resolve e o
 * perfil contava a lista crua, o app abria dizendo "3 salvas" com a aba de
 * salvos vazia. Dois números, duas telas, nenhum verdadeiro.
 */
export const useSaved = create<SavedState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [id, ...s.ids],
        })),
    }),
    {
      name: 'foiaqui-salvos',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Assina só o booleano deste id — não re-renderiza quando outro item muda. */
export const useIsSaved = (id: string) => useSaved((s) => s.ids.includes(id));
