import { useCallback, useSyncExternalStore } from 'react';

import { useAcervo } from '@/store/acervo';
import { useColecoes } from '@/store/colecoes';
import { useSaved } from '@/store/saved';

/** O mínimo que este arquivo precisa de uma store com `persist`. */
interface ComPersist {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (aviso: () => void) => () => void;
  };
}

/**
 * Se o que está guardado no aparelho já saiu do disco.
 *
 * Ler AsyncStorage é assíncrono: entre o primeiro quadro e a chegada dos dados
 * existe uma janela em que a lista está legitimamente vazia — mas por não ter
 * carregado ainda, não por não existir.
 *
 * Sem essa distinção, quem tem dezessete memórias abre o app e lê "você ainda
 * não enviou nenhuma memória". A tela não erra por bug; ela responde antes de
 * saber. É o mesmo problema da geocodificação sem prazo: a interface afirmando
 * com confiança uma coisa que ainda não apurou.
 *
 * `useSyncExternalStore` em vez de `useEffect` + `useState` porque a hidratação
 * pode terminar entre a renderização e o efeito — e aí a assinatura chegaria
 * tarde, deixando a tela presa no "carregando" para sempre.
 *
 * Recebe as stores que a tela realmente lê: vigiar a store errada é pior que
 * não vigiar nenhuma, porque dá a impressão de que o problema foi tratado.
 */
function useHidratado(lojas: ComPersist[]): boolean {
  const assinar = useCallback(
    (avisar: () => void) => {
      const cancelar = lojas.map((l) => l.persist.onFinishHydration(avisar));
      return () => cancelar.forEach((c) => c());
    },
    // as listas são constantes por chamada — ver os hooks abaixo
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const ler = useCallback(
    () => lojas.every((l) => l.persist.hasHydrated()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  return useSyncExternalStore(assinar, ler);
}

/** Para telas que listam o que a pessoa criou. */
export const useAcervoHidratado = () => useHidratado([useAcervo]);

/** Para a aba Salvos: marcadores e coleções vêm de stores diferentes. */
export const useSalvosHidratado = () => useHidratado([useSaved, useColecoes]);
