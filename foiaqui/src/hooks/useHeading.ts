import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

/**
 * Para onde o celular está apontado, em graus (0 = norte).
 *
 * `null` enquanto a bússola não responde — em emulador e em aparelhos sem
 * magnetômetro ela nunca responde, e a interface precisa dizer isso em vez
 * de fingir que sabe a direção.
 */
export function useHeading(ativo: boolean): number | null {
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    if (!ativo) return;
    let vivo = true;
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      try {
        sub = await Location.watchHeadingAsync((h) => {
          if (!vivo) return;
          // trueHeading exige GPS ativo; magHeading sempre existe onde há bússola
          const valor = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          setHeading(valor);
        });
      } catch {
        if (vivo) setHeading(null);
      }
    })();

    return () => {
      vivo = false;
      sub?.remove();
    };
  }, [ativo]);

  return heading;
}
