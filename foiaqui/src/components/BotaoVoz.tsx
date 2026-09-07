import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/components/Icon';
import { Body } from '@/components/Type';
import { colors, HIT, space } from '@/theme';

/**
 * O ditado e a busca falada compartilham o mesmo motor.
 *
 * A diferença entre os dois não é cosmética: buscar é uma frase curta que
 * termina no primeiro silêncio; contar um causo tem pausa no meio e não pode
 * ser interrompido por ela. Daí `continuous`.
 *
 * `anterior` guarda o que já estava escrito quando a pessoa apertou o
 * microfone. Sem isso, ditar apaga o que ela tinha digitado antes — e ninguém
 * espera que o botão de falar seja também um botão de apagar.
 */
function useDitado(onTexto: (t: string) => void, continuo: boolean) {
  const [ouvindo, setOuvindo] = useState(false);
  const [indisponivel, setIndisponivel] = useState(false);
  const anterior = useRef('');

  useSpeechRecognitionEvent('start', () => setOuvindo(true));
  useSpeechRecognitionEvent('end', () => setOuvindo(false));
  useSpeechRecognitionEvent('error', () => setOuvindo(false));
  useSpeechRecognitionEvent('result', (evento) => {
    const dito = evento.results[0]?.transcript;
    if (!dito) return;
    const antes = anterior.current.trimEnd();
    onTexto(antes ? `${antes} ${dito}` : dito);
  });

  const alternar = async (textoAtual = '') => {
    if (ouvindo) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    try {
      const permissao = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permissao.granted) return;
      anterior.current = textoAtual;
      ExpoSpeechRecognitionModule.start({
        lang: 'pt-BR',
        // resultado parcial: o texto aparece enquanto a pessoa fala. Esperar o
        // silêncio final para mostrar qualquer coisa parece travamento
        interimResults: true,
        continuous: continuo,
      });
    } catch {
      setIndisponivel(true);
    }
  };

  return { ouvindo, indisponivel, alternar };
}

/**
 * Buscar falando, no campo de busca do mapa.
 *
 * A Decisão 7 descreve o contexto real — sol na tela, mão ocupada, andando — e
 * digitar "Vicentina Aranha" no teclado do celular nessa situação é o tipo de
 * trabalho que faz desistir da busca.
 *
 * Some quando não há reconhecimento no aparelho: botão que não faz nada ocupa
 * alvo de toque e ensina a desconfiar da interface.
 */
export function BotaoVoz({ onTexto }: { onTexto: (texto: string) => void }) {
  const { ouvindo, indisponivel, alternar } = useDitado(onTexto, false);
  if (indisponivel) return null;

  return (
    <Pressable
      onPress={() => alternar()}
      hitSlop={10}
      style={[styles.botao, ouvindo && styles.ouvindo]}
      accessibilityRole="button"
      accessibilityState={{ busy: ouvindo }}
      accessibilityLabel={ouvindo ? 'Parar de ouvir' : 'Buscar falando'}>
      <Icon
        name="mic"
        size={17}
        color={ouvindo ? colors.sobreFerrugem : colors.grafiteDim}
        strokeWidth={2}
      />
    </Pressable>
  );
}

/**
 * Contar a memória falando, em vez de digitar.
 *
 * É a resposta ao problema central do produto. A Decisão 4 diz que áudio é
 * mídia de primeira classe porque "gravar trinta segundos é mais fácil que
 * escrever" — mas áudio no acervo é caixa preta: não tem título, não entra na
 * busca, ninguém lê de passagem. Ditar resolve os dois lados: a pessoa fala, e
 * o que sai é texto que ela pode corrigir antes de enviar.
 *
 * Para quem tem setenta anos e não digita com facilidade, é a maior redução de
 * atrito que este app tem para oferecer — e não substitui a gravação de áudio,
 * que continua ali para quem quer a voz preservada.
 */
export function DitarRelato({
  valor,
  onTexto,
}: {
  valor: string;
  onTexto: (texto: string) => void;
}) {
  const { ouvindo, indisponivel, alternar } = useDitado(onTexto, true);
  if (indisponivel) return null;

  return (
    <Pressable
      onPress={() => alternar(valor)}
      style={[styles.ditar, ouvindo && styles.ditarOuvindo]}
      accessibilityRole="button"
      accessibilityState={{ busy: ouvindo }}
      accessibilityLabel={ouvindo ? 'Parar de ditar' : 'Contar a história falando'}>
      <Icon
        name="mic"
        size={17}
        color={ouvindo ? colors.sobreFerrugem : colors.esmalte}
        strokeWidth={2}
      />
      <Body style={[styles.ditarText, ouvindo && styles.ditarTextOuvindo]}>
        {ouvindo ? 'Ouvindo… toque para parar' : 'Contar falando'}
      </Body>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    width: HIT - 8,
    height: HIT - 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ouvindo: { backgroundColor: colors.ferrugem },

  ditar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: HIT,
    marginTop: space.sm,
    borderWidth: 1.5,
    borderColor: colors.esmalte,
  },
  ditarOuvindo: { backgroundColor: colors.ferrugem, borderColor: colors.ferrugem },
  ditarText: { fontSize: 14.5, fontWeight: '600', color: colors.esmalte },
  ditarTextOuvindo: { color: colors.sobreFerrugem },
});
