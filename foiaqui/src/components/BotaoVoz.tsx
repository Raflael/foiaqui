import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/components/Icon';
import { colors, HIT } from '@/theme';

/**
 * Ditar a busca em vez de digitar.
 *
 * A Decisão 7 descreve o contexto real: sol na tela, mão ocupada, andando.
 * Digitar "Vicentina Aranha" nessa situação, com teclado de celular, é o tipo
 * de trabalho que faz a pessoa desistir da busca e sair rolando o mapa.
 *
 * E há a razão maior, que é a persona: a Íris tem 70 anos. Teclado pequeno é
 * a barreira mais citada nessa faixa, e a voz é a interface que ela já usa
 * sem esforço — quem não digita bem costuma falar com o celular sem nenhuma
 * cerimônia.
 *
 * Some quando não há reconhecimento no aparelho. Botão que não faz nada ocupa
 * alvo de toque e ensina a desconfiar da interface — a mesma regra do "x" de
 * limpar a busca.
 */
export function BotaoVoz({ onTexto }: { onTexto: (texto: string) => void }) {
  const [ouvindo, setOuvindo] = useState(false);
  const [indisponivel, setIndisponivel] = useState(false);

  useSpeechRecognitionEvent('start', () => setOuvindo(true));
  useSpeechRecognitionEvent('end', () => setOuvindo(false));
  useSpeechRecognitionEvent('error', () => setOuvindo(false));
  useSpeechRecognitionEvent('result', (evento) => {
    const dito = evento.results[0]?.transcript;
    if (dito) onTexto(dito);
  });

  const alternar = async () => {
    if (ouvindo) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    try {
      const permissao = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permissao.granted) return;
      ExpoSpeechRecognitionModule.start({
        lang: 'pt-BR',
        // resultado parcial: o texto aparece enquanto a pessoa fala, e o mapa
        // já filtra junto — esperar o silêncio final parece travamento
        interimResults: true,
        continuous: false,
      });
    } catch {
      setIndisponivel(true);
    }
  };

  if (indisponivel) return null;

  return (
    <Pressable
      onPress={alternar}
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

const styles = StyleSheet.create({
  botao: {
    width: HIT - 8,
    height: HIT - 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ouvindo: { backgroundColor: colors.ferrugem },
});
