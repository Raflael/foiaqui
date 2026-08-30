import { create } from 'zustand';

interface Importada {
  uri: string;
  credito: string;
  titulo: string;
}

interface ImportadaState {
  escolhida: Importada | null;
  guardar: (foto: Importada) => void;
  limpar: () => void;
}

/**
 * A ponte entre a busca no acervo livre e o formulário de criar.
 *
 * Não é persistido: é um recado de uma tela para a outra, com duração de um
 * ida-e-volta. Guardar no aparelho faria a foto reaparecer semanas depois num
 * formulário que não a pediu — e o rascunho, esse sim persistido, já é o
 * lugar de guardar intenção.
 */
export const useImportada = create<ImportadaState>((set) => ({
  escolhida: null,
  guardar: (foto) => set({ escolhida: foto }),
  limpar: () => set({ escolhida: null }),
}));
