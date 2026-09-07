import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

import { relativeAngle } from '@/data/location';

/** Quanto de cada leitura nova entra na média. Baixo = mais firme, mais lento. */
const SUAVIZACAO = 0.18;

/** Só re-renderiza quando a direção muda mais que isto, em graus. */
const ZONA_MORTA = 1.2;

/**
 * Para onde o celular está apontado, em graus (0 = norte).
 *
 * `null` enquanto a bússola não responde — em emulador e em aparelho sem
 * magnetômetro ela nunca responde, e a interface precisa dizer isso em vez
 * de fingir que sabe a direção.
 *
 * **A média é circular, não aritmética.** Suavizar azimute somando e dividindo
 * quebra na virada do norte: entre 359° e 1° a média ingênua dá 180°, ou seja,
 * a bússola aponta para o sul exatamente quando você olha para o norte. Aqui a
 * suavização anda pela DIFERENÇA angular, que já vem normalizada para o menor
 * arco, e só depois volta para o intervalo 0–360.
 *
 * A suavização existe porque o magnetômetro treme vários graus com o aparelho
 * parado, e no FoiAqui esse tremor tem consequência visível: a AR decide o que
 * mostrar comparando o azimute da memória com este valor, então uma memória na
 * borda do campo de visão entrava e saía de cena a cada leitura. Era metade do
 * "piscando" relatado no aparelho; a outra metade era o acelerômetro, tratado
 * em `useInclinacao`.
 */
export function useHeading(ativo: boolean): number | null {
  const [heading, setHeading] = useState<number | null>(null);
  const media = useRef<number | null>(null);
  const publicado = useRef<number | null>(null);

  useEffect(() => {
    if (!ativo) return;
    let vivo = true;
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      try {
        sub = await Location.watchHeadingAsync((h) => {
          if (!vivo) return;
          // trueHeading exige GPS ativo; magHeading sempre existe onde há bússola
          const bruto = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;

          media.current =
            media.current === null
              ? bruto
              : (media.current + SUAVIZACAO * relativeAngle(bruto, media.current) + 360) % 360;

          if (
            publicado.current === null ||
            Math.abs(relativeAngle(media.current, publicado.current)) > ZONA_MORTA
          ) {
            publicado.current = media.current;
            setHeading(media.current);
          }
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
