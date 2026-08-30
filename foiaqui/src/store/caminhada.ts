import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface CaminhadaState {
  /** por trilha, os ids das paradas onde a pessoa já disse "cheguei" */
  chegadas: Record<string, string[]>;
  marcar: (trilhaId: string, memoriaId: string) => void;
  desmarcar: (trilhaId: string, memoriaId: string) => void;
  recomecar: (trilhaId: string) => void;
}

/**
 * O modo caminhada das trilhas (Decisão 10 encontrando a Decisão 7).
 *
 * "Cheguei" é um botão, não um geofence. A tentação era marcar a parada
 * sozinho pelo GPS — e seria pior: o sinal erra 40 metros no centro, a pessoa
 * do outro lado da praça veria a parada "feita" sem ter chegado, e quem quer
 * marcar de casa (planejando a caminhada de domingo) não conseguiria. O toque
 * devolve o controle a quem anda.
 *
 * Persistido porque caminhada de verdade se interrompe: chove, o bar abre,
 * o neto liga. Voltar amanhã e encontrar as três primeiras paradas marcadas
 * é o que faz a trilha ser caminhável de verdade, e não numa sentada só.
 */
export const useCaminhada = create<CaminhadaState>()(
  persist(
    (set) => ({
      chegadas: {},
      marcar: (trilhaId, memoriaId) =>
        set((s) => {
          const atual = s.chegadas[trilhaId] ?? [];
          if (atual.includes(memoriaId)) return s;
          return { chegadas: { ...s.chegadas, [trilhaId]: [...atual, memoriaId] } };
        }),
      desmarcar: (trilhaId, memoriaId) =>
        set((s) => ({
          chegadas: {
            ...s.chegadas,
            [trilhaId]: (s.chegadas[trilhaId] ?? []).filter((id) => id !== memoriaId),
          },
        })),
      recomecar: (trilhaId) =>
        set((s) => ({ chegadas: { ...s.chegadas, [trilhaId]: [] } })),
    }),
    {
      name: 'foiaqui-caminhada',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/**
 * Quantas trilhas foram completadas — só conta parada que EXISTE no acervo.
 * O roteiro admite paradas sem memória ainda; cobrar chegada nelas seria
 * exigir caminhar até um pin que não está no mapa.
 */
export const trilhasCompletas = (
  chegadas: Record<string, string[]>,
  trilhas: { id: string; stopIds: string[] }[],
  existe: (id: string) => boolean,
) =>
  trilhas.filter((t) => {
    const reais = t.stopIds.filter(existe);
    if (reais.length === 0) return false;
    const feitas = chegadas[t.id] ?? [];
    return reais.every((id) => feitas.includes(id));
  }).length;
