import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { fallbackPosition, type Position } from '@/data/location';

export type PositionSource = 'gps' | 'fallback' | 'pending';

export interface CurrentPosition {
  position: Position;
  /** raio de incerteza em metros, quando o GPS informa */
  accuracy: number | null;
  source: PositionSource;
  /** a pessoa negou a permissão — a interface precisa dizer isso, não fingir */
  denied: boolean;
}

/**
 * Onde a pessoa está.
 *
 * Duas decisões vindas da Decisão 7 ("sol na tela, mão ocupada, sinal instável"):
 *
 * 1. **Nunca fica sem resposta.** Se a permissão for negada ou o GPS falhar,
 *    devolve a posição de fallback e marca `source`. O app continua útil —
 *    o mapa abre no centro de Santos em vez de numa tela morta.
 * 2. **Devolve a precisão junto.** Um ponto azul cravado num lugar onde o GPS
 *    tem 80 metros de erro é mentira. Quem desenha decide o que fazer com o
 *    raio; aqui a gente só não esconde.
 */
export function useCurrentPosition(): CurrentPosition {
  const [state, setState] = useState<CurrentPosition>({
    position: fallbackPosition,
    accuracy: null,
    source: 'pending',
    denied: false,
  });

  useEffect(() => {
    let active = true;
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!active) return;

      if (status !== 'granted') {
        setState({
          position: fallbackPosition,
          accuracy: null,
          source: 'fallback',
          denied: true,
        });
        return;
      }

      try {
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            // andando pela cidade, atualizar a cada 10 m é suficiente e
            // poupa bateria — o app é para uso prolongado na rua
            distanceInterval: 10,
            timeInterval: 5000,
          },
          (reading) => {
            if (!active) return;
            setState({
              position: { lat: reading.coords.latitude, lng: reading.coords.longitude },
              accuracy: reading.coords.accuracy ?? null,
              source: 'gps',
              denied: false,
            });
          },
        );
      } catch {
        if (!active) return;
        // GPS indisponível (sem sinal, modo avião): segue com o fallback
        setState({
          position: fallbackPosition,
          accuracy: null,
          source: 'fallback',
          denied: false,
        });
      }
    })();

    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);

  return state;
}
