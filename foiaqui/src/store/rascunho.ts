import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Position } from '@/data/location';

export interface Rascunho {
  step: number;
  media: { uri: string; type: 'image' | 'video' } | null;
  hoje: string | null;
  audio: { uri: string; seconds: number } | null;
  story: string;
  era: string | null;
  tags: string[];
  local: Position | null;
}

const VAZIO: Rascunho = {
  step: 0,
  media: null,
  hoje: null,
  audio: null,
  story: '',
  era: null,
  tags: [],
  local: null,
};

interface RascunhoState extends Rascunho {
  salvar: (parcial: Partial<Rascunho>) => void;
  limpar: () => void;
}

/**
 * O que a pessoa começou a escrever fica guardado no aparelho.
 *
 * Não é conveniência: o contexto de uso é a calçada, com uma mão, e qualquer
 * ligação, mensagem ou distração fecha o app. Perder a foto tirada e o relato
 * digitado nessa hora é o tipo de coisa que faz alguém desistir de contribuir
 * — e o lado que CRIA é o mais difícil dos dois (Decisão 7 e entrevista com a PO).
 *
 * Os caminhos de mídia apontam para arquivos do aparelho. Se o sistema limpar
 * o cache, a imagem some e o campo volta a ficar vazio — o texto, que é o mais
 * caro de refazer, sobrevive de qualquer jeito.
 */
export const useRascunho = create<RascunhoState>()(
  persist(
    (set) => ({
      ...VAZIO,
      salvar: (parcial) => set(parcial),
      limpar: () => set(VAZIO),
    }),
    {
      name: 'foiaqui-rascunho',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Há algo que valha a pena recuperar? */
export const temConteudo = (r: Rascunho) =>
  !!r.media || !!r.audio || r.story.trim().length > 0 || !!r.era || r.tags.length > 0;
