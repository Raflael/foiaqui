import { create } from 'zustand';

interface LinhaDoTempoState {
  /** década escolhida na régua do mapa; null = todas as épocas */
  decada: number | null;
  escolher: (decada: number | null) => void;
}

/**
 * A década selecionada na régua do mapa (Decisão 11).
 *
 * Vive fora da tela do mapa porque não é só a régua que a escolhe: a ficha
 * tem um "Linha do tempo" que fecha a folha e leva o mapa para a época
 * daquela memória. Estado que duas telas mexem não pode morar dentro de uma
 * delas.
 *
 * Não é persistido de propósito. Recorte de época é intenção do momento —
 * abrir o app amanhã filtrado nos anos 30 sem lembrar por quê seria um mapa
 * quebrado, e a pessoa procuraria o defeito no lugar errado.
 */
export const useLinhaDoTempo = create<LinhaDoTempoState>((set) => ({
  decada: null,
  escolher: (decada) => set({ decada }),
}));
