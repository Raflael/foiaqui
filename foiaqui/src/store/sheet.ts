import { create } from 'zustand';

export type Snap = 'peek' | 'mid' | 'full';

interface SheetState {
  /** id da Memory aberta, ou null quando a ficha está fechada */
  openId: string | null;
  snap: Snap;
  open: (id: string, snap?: Snap) => void;
  /** troca a memória mantendo a altura atual — usado em "mais memórias deste local" */
  swap: (id: string) => void;
  setSnap: (snap: Snap) => void;
  close: () => void;
}

/**
 * A ficha de memória virou estado, não rota.
 *
 * A Decisão 2 da pesquisa manda usar bottom sheet deslizante justamente para
 * "manter o usuário no contexto geográfico e permitir passar de uma memória
 * para outra sem recarregar telas". Enquanto ela era uma rota `/ficha/[id]`,
 * abrir uma memória empilhava tela e escondia o mapa — o oposto da decisão.
 *
 * Com o estado aqui, o mapa continua vivo por baixo, reage à abertura
 * (reposiciona o pin) e trocar de memória é um `swap`, sem navegação.
 */
export const useSheet = create<SheetState>((set) => ({
  openId: null,
  snap: 'mid',
  open: (id, snap = 'mid') => set({ openId: id, snap }),
  swap: (id) => set({ openId: id }),
  setSnap: (snap) => set({ snap }),
  close: () => set({ openId: null }),
}));
