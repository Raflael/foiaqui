import { DeviceMotion } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';

/** Quanto de cada leitura nova entra na média. Baixo = mais firme, mais lento. */
const SUAVIZACAO = 0.12;

/** Só re-renderiza quando o ângulo muda mais que isto, em graus. */
const ZONA_MORTA = 0.6;

/**
 * Para onde o celular aponta na vertical, em graus.
 *
 * `0` é o horizonte, positivo é para cima, negativo para baixo. `null` enquanto
 * o sensor não responde — em emulador e em aparelho sem acelerômetro ele nunca
 * responde, e a interface precisa dizer isso em vez de fingir.
 *
 * **Por que a gravidade e não `rotation.beta`.** O DeviceMotion entrega os dois:
 * ângulos de Euler (`rotation`) e o vetor de aceleração com gravidade. Os
 * ângulos são o caminho óbvio e o errado — a convenção de sinal e o zero de
 * `beta` mudam entre plataformas. O vetor de gravidade aponta para o centro da
 * Terra em qualquer aparelho, e o resto é trigonometria.
 *
 * **O sinal do eixo z foi medido, não deduzido.** A dedução dizia que olhar
 * para baixo daria `z` negativo; no aparelho é o contrário — a implementação
 * segue a convenção em que o aparelho deitado com a tela para cima (câmera
 * para o chão) lê `z` positivo. Isso valeu um relato de campo: a tela mandava
 * "abaixe o celular" para quem já estava apontando para o próprio pé. Fica
 * registrado porque é exatamente o tipo de coisa que a documentação não diz e
 * que a próxima pessoa reinventaria errado.
 *
 * **Suavização não é enfeite.** O acelerômetro oscila um ou dois graus a cada
 * leitura mesmo com o braço parado. Sem média, o horizonte treme, e cards
 * perto da borda da tela entram e saem de vista a dez vezes por segundo — foi
 * o "piscando" relatado. A média móvel firma o valor e a zona morta corta o
 * re-render: sem ela a tela inteira redesenha dez vezes por segundo enquanto a
 * câmera já está consumindo o aparelho.
 */
export function useInclinacao(ativo: boolean): number | null {
  const [graus, setGraus] = useState<number | null>(null);
  const media = useRef<number | null>(null);
  const publicado = useRef<number | null>(null);

  useEffect(() => {
    if (!ativo) return;
    let vivo = true;
    let sub: { remove: () => void } | null = null;

    (async () => {
      try {
        if (!(await DeviceMotion.isAvailableAsync())) return;
        if (!vivo) return;
        // 60 ms: acompanha o braço sem virar enxurrada de eventos
        DeviceMotion.setUpdateInterval(60);
        sub = DeviceMotion.addListener(({ accelerationIncludingGravity: g }) => {
          if (!vivo || !g) return;

          const horizontal = Math.hypot(g.x, g.y);
          // queda livre ou leitura degenerada: não inventa ângulo
          if (horizontal < 0.5 && Math.abs(g.z) < 0.5) return;

          const bruto = (Math.atan2(g.z, horizontal) * 180) / Math.PI;
          media.current =
            media.current === null
              ? bruto
              : media.current + SUAVIZACAO * (bruto - media.current);

          if (
            publicado.current === null ||
            Math.abs(media.current - publicado.current) > ZONA_MORTA
          ) {
            publicado.current = media.current;
            setGraus(media.current);
          }
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
