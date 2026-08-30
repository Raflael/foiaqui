import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface Colecao {
  id: string;
  nome: string;
  memoriaIds: string[];
  criadaEm: number;
}

interface ColecoesState {
  colecoes: Colecao[];
  criar: (nome: string) => string;
  renomear: (id: string, nome: string) => void;
  apagar: (id: string) => void;
  guardar: (colecaoId: string, memoriaId: string) => void;
  tirar: (colecaoId: string, memoriaId: string) => void;
}

/**
 * Coleções: a Decisão 10 da pesquisa.
 *
 * A hierarquia que o Historypin ensinou é **pino → coleção → roteiro**, nessa
 * ordem de implementação, porque cada nível só faz sentido com densidade do
 * anterior. Os pinos existem, os roteiros existem — a coleção era o degrau
 * pulado, e sem ela "Salvos" é uma pilha: dez memórias soltas numa lista que
 * ninguém consegue usar para nada.
 *
 * Coleção é o que transforma guardar em CURAR. "O centro da minha infância",
 * "Para mostrar pra minha mãe", "Trabalho de história do 8º ano" — é aqui que
 * o acervo deixa de ser do app e passa a ser da pessoa, e é o que a PO tinha
 * em mente ao falar de escolas e instituições montando percursos.
 *
 * Salvar continua sendo um toque e não pergunta nada: a coleção é um segundo
 * momento, opcional. Obrigar a escolher pasta na hora de salvar mataria o
 * gesto rápido, que é o que faz a pessoa salvar.
 *
 * Uma memória pode estar em várias coleções — é marcador, não pasta. E o que
 * está salvo sem coleção nenhuma continua visível como "não organizados", em
 * vez de sumir num limbo.
 */
export const useColecoes = create<ColecoesState>()(
  persist(
    (set) => ({
      colecoes: [],

      criar: (nome) => {
        const id = `col-${Date.now()}`;
        set((s) => ({
          colecoes: [
            { id, nome: nome.trim() || 'Sem nome', memoriaIds: [], criadaEm: Date.now() },
            ...s.colecoes,
          ],
        }));
        return id;
      },

      renomear: (id, nome) =>
        set((s) => ({
          colecoes: s.colecoes.map((c) =>
            c.id === id ? { ...c, nome: nome.trim() || c.nome } : c,
          ),
        })),

      apagar: (id) => set((s) => ({ colecoes: s.colecoes.filter((c) => c.id !== id) })),

      guardar: (colecaoId, memoriaId) =>
        set((s) => ({
          colecoes: s.colecoes.map((c) =>
            c.id === colecaoId && !c.memoriaIds.includes(memoriaId)
              ? { ...c, memoriaIds: [memoriaId, ...c.memoriaIds] }
              : c,
          ),
        })),

      tirar: (colecaoId, memoriaId) =>
        set((s) => ({
          colecoes: s.colecoes.map((c) =>
            c.id === colecaoId
              ? { ...c, memoriaIds: c.memoriaIds.filter((id) => id !== memoriaId) }
              : c,
          ),
        })),
    }),
    {
      name: 'foiaqui-colecoes',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Em quais coleções esta memória está. */
export const useColecoesDe = (memoriaId?: string | null) =>
  useColecoes((s) =>
    memoriaId ? s.colecoes.filter((c) => c.memoriaIds.includes(memoriaId)) : [],
  );

export const colecaoPor = (id?: string | null) =>
  useColecoes.getState().colecoes.find((c) => c.id === id);
