import { create } from 'zustand';

interface SavedState {
  /** ids de Memory salvos, na ordem em que foram salvos (mais recente primeiro) */
  ids: string[];
  toggle: (id: string) => void;
}

/**
 * Estado global mínimo do protótipo: o que a pessoa salvou.
 * Em memória mesmo — reinicia junto com o app, e tudo bem nesta fase.
 */
export const useSaved = create<SavedState>((set) => ({
  ids: ['cine', 'praca', 'mural'],
  toggle: (id) =>
    set((s) => ({
      ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [id, ...s.ids],
    })),
}));

/** Assina só o booleano deste id — não re-renderiza quando outro item muda. */
export const useIsSaved = (id: string) => useSaved((s) => s.ids.includes(id));
