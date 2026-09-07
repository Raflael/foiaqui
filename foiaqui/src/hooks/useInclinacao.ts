import { DeviceMotion } from 'expo-sensors';
import { useEffect, useState } from 'react';

/**
 * Para onde o celular aponta na vertical, em graus.
 *
 * `0` é o horizonte, positivo é para cima, negativo para baixo. `null` enquanto
 * o sensor não responde — em emulador e em aparelho sem acelerômetro ele nunca
 * responde, e a interface precisa dizer isso em vez de fingir.
 *
 * **Por que a gravidade e não `rotation.beta`.** O DeviceMotion entrega os dois:
 * ângulos de Euler (`rotation`) e o vetor de aceleração com gravidade. Os
 * ângulos são o caminho óbvio e o errado: a convenção de sinal e o zero de
 * `beta` mudam entre Android e iOS, então acertar exigiria calibrar no
 * aparelho e torcer para a outra plataforma combinar. O vetor de gravidade não
 * tem essa ambiguidade — ele aponta para o centro da Terra, e o resto é
 * trigonometria.
 *
 * No referencial do aparelho, `y` sobe pela tela e `z` sai da tela na direção
 * de quem olha. Com o celular na vertical, a gravidade está toda em `-y` e
 * `z` é zero. Inclinando para olhar o céu, a tela vira para cima e a gravidade
 * ganha componente em `-z`; olhando o chão, ganha em `+z`. Logo o ângulo em
 * relação ao horizonte é `atan2(-z, |(x, y)|)`, positivo para cima — e isso
 * vale em qualquer plataforma, porque é física e não convenção de API.
 */
export function useInclinacao(ativo: boolean): number | null {
  const [graus, setGraus] = useState<number | null>(null);

  useEffect(() => {
    if (!ativo) return;
    let vivo = true;
    let sub: { remove: () => void } | null = null;

    (async () => {
      try {
        if (!(await DeviceMotion.isAvailableAsync())) return;
        if (!vivo) return;
        // 100 ms: rápido o bastante para acompanhar o braço, devagar o bastante
        // para não fritar bateria numa tela que já usa câmera e GPS
        DeviceMotion.setUpdateInterval(100);
        sub = DeviceMotion.addListener(({ accelerationIncludingGravity: g }) => {
          if (!vivo || !g) return;
          const horizontal = Math.hypot(g.x, g.y);
          // aparelho em queda livre ou leitura degenerada: não inventa ângulo
          if (horizontal < 0.5 && Math.abs(g.z) < 0.5) return;
          setGraus((Math.atan2(-g.z, horizontal) * 180) / Math.PI);
        });
      } catch {
        if (vivo) setGraus(null);
      }
    })();

    return () => {
      vivo = false;
      sub?.remove();
    };
  }, [ativo]);

  return graus;
}
