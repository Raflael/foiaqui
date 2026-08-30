import { useEffect, useState } from 'react';

/** tempo de captura: sobra folga para o primeiro layout do marcador */
const JANELA_MS = 1200;

/**
 * Faz marcador customizado aparecer no mapa do Android.
 *
 * No Android o `<Marker>` com filho React não é desenhado pelo mapa: ele é
 * capturado como bitmap uma vez e o mapa passa a exibir a foto. Com
 * `tracksViewChanges={false}` desde o início, a captura acontece antes do
 * primeiro layout e o que congela é uma view vazia — o pin vira um retângulo
 * azul em branco. Deixar `true` para sempre resolve a aparência e destrói o
 * desempenho, porque o mapa recaptura todo frame.
 *
 * A solução é uma janela: captura ligada até o marcador existir, depois
 * desligada. E ela precisa REABRIR quando o conjunto de marcadores muda —
 * foi o que faltou da primeira vez, e por isso criar uma memória fazia as
 * outras sumirem do mapa (apareciam na lista, e não no mapa).
 *
 * `chave` é o que descreve o estado visual dos marcadores. Mudou a chave,
 * reabre a captura.
 */
export function useMarkerTracking(chave: string) {
  const [mapaPronto, setMapaPronto] = useState(false);
  const [capturando, setCapturando] = useState(true);

  useEffect(() => {
    // esperar o mapa: montar a tela não é o mesmo que o mapa existir, e a
    // diferença entre os dois chega a alguns segundos no primeiro carregamento
    if (!mapaPronto) return;
    setCapturando(true);
    const t = setTimeout(() => setCapturando(false), JANELA_MS);
    return () => clearTimeout(t);
  }, [mapaPronto, chave]);

  return {
    /** passe para `onMapReady` do MapView */
    aoCarregarMapa: () => setMapaPronto(true),
    /** passe para `tracksViewChanges` de cada Marker */
    capturando,
  };
}
