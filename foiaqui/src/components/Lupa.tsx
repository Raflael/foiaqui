import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Mono } from '@/components/Type';
import { fonteDaImagem } from '@/data/imagens';
import { alpha, colors, HIT, space } from '@/theme';

const MIN = 1;
const MAX = 5;

/**
 * A foto em tela cheia, com pinça para aproximar.
 *
 * A ficha mostra a foto a 240 px de altura — o suficiente para reconhecer o
 * lugar, insuficiente para o que as pessoas realmente fazem com foto antiga:
 * procurar o rosto do avô na porta da loja, ler a placa do carro, achar o
 * letreiro. Sem zoom, a memória fica visível e ilegível ao mesmo tempo.
 *
 * Fundo escuro aqui não contradiz a identidade clara do app: é o mesmo motivo
 * de qualquer visor de fotos — a moldura precisa sumir para a imagem
 * aparecer, e cal atrás de uma foto sépia rouba contraste dela.
 *
 * Duplo toque alterna entre inteira e aproximada: quem não consegue fazer
 * pinça com precisão (a persona tem 70 anos) ainda chega ao zoom.
 */
export function Lupa({
  fonte,
  legenda,
  aberta,
  onFechar,
}: {
  fonte?: string | number;
  legenda?: string;
  aberta: boolean;
  onFechar: () => void;
}) {
  const insets = useSafeAreaInsets();
  const escala = useSharedValue(1);
  const base = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const xBase = useSharedValue(0);
  const yBase = useSharedValue(0);

  const reset = () => {
    escala.value = withTiming(1);
    x.value = withTiming(0);
    y.value = withTiming(0);
    base.value = 1;
    xBase.value = 0;
    yBase.value = 0;
  };

  const pinca = Gesture.Pinch()
    .onUpdate((e) => {
      escala.value = Math.min(Math.max(base.value * e.scale, MIN), MAX);
    })
    .onEnd(() => {
      base.value = escala.value;
      // voltou ao tamanho natural: recentraliza, senão a foto fica "presa" torta
      if (escala.value <= MIN + 0.01) {
        x.value = withTiming(0);
        y.value = withTiming(0);
        xBase.value = 0;
        yBase.value = 0;
      }
    });

  const arrasto = Gesture.Pan()
    .onUpdate((e) => {
      // só arrasta quando há o que arrastar
      if (escala.value <= MIN + 0.01) return;
      x.value = xBase.value + e.translationX;
      y.value = yBase.value + e.translationY;
    })
    .onEnd(() => {
      xBase.value = x.value;
      yBase.value = y.value;
    });

  const duploToque = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const perto = escala.value > MIN + 0.01;
      escala.value = withTiming(perto ? MIN : 2.5);
      base.value = perto ? MIN : 2.5;
      if (perto) {
        x.value = withTiming(0);
        y.value = withTiming(0);
        xBase.value = 0;
        yBase.value = 0;
      }
    });

  const gesto = Gesture.Simultaneous(pinca, arrasto, duploToque);

  const estilo = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: escala.value }],
  }));

  return (
    <Modal
      visible={aberta}
      transparent
      animationType="fade"
      onRequestClose={onFechar}
      statusBarTranslucent>
      {/*
        Raiz de gestos própria dentro do Modal.
        O Modal do React Native monta numa árvore de views separada, fora do
        GestureHandlerRootView do app — sem esta segunda raiz, pinça e arraste
        simplesmente não chegam, e o visor abre morto. Foi exatamente o que
        aconteceu no aparelho.
      */}
      <GestureHandlerRootView style={styles.fundo}>
        <GestureDetector gesture={gesto}>
          <Animated.View style={[StyleSheet.absoluteFill, estilo]}>
            <Image source={fonteDaImagem(fonte)} style={StyleSheet.absoluteFill} contentFit="contain" />
          </Animated.View>
        </GestureDetector>

        <Pressable
          style={[styles.fechar, { top: insets.top + space.md }]}
          onPress={() => {
            reset();
            onFechar();
          }}
          accessibilityRole="button"
          accessibilityLabel="Fechar a foto">
          <Icon name="x" size={20} color={colors.sobreEsmalte} strokeWidth={2.4} />
        </Pressable>

        <View style={[styles.rodape, { paddingBottom: insets.bottom + space.lg }]}>
          {legenda ? <Mono style={styles.legenda}>{legenda}</Mono> : null}
          <Mono style={styles.dica}>pinça ou toque duplo para aproximar</Mono>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: '#0B0F16' },
  fechar: {
    position: 'absolute',
    right: space.lg,
    width: HIT,
    height: HIT,
    borderRadius: HIT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha.chrome,
  },
  rodape: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    gap: 4,
    paddingTop: space.lg,
    backgroundColor: alpha.veu,
  },
  legenda: { fontSize: 13, color: colors.sobreEsmalte },
  dica: { fontSize: 11, color: colors.sobreEsmalteDim },
});
