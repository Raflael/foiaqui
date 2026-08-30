import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components/Icon';
import { PhotoPlaceholder, StreetScene } from '@/components/PhotoPlaceholder';
import { Mono } from '@/components/Type';
import { useMotionEnabled } from '@/hooks/useMotion';
import { colors, HIT, radius } from '@/theme';

const EDGE = 0.05; // não deixa o divisor encostar na borda: sempre sobra dos dois lados
const START = 0.58; // mesma posição inicial do protótipo
const KNOB = HIT;

function clampPx(v: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(v, min), max);
}

/**
 * Slider passado↔presente — a interação-assinatura do FoiAqui.
 *
 * Arrastar o divisor revela a foto antiga (sépia) por cima da vista de hoje.
 * A camada do passado vive dentro de um wrapper com `overflow:hidden` cuja
 * largura é animada; o conteúdo lá dentro tem largura FIXA (a do container),
 * senão a imagem esmagaria em vez de ser revelada.
 *
 * Toda a conta roda na UI thread (Reanimated), então o arraste não sofre
 * com re-render da ficha.
 */
export function RevealSlider({
  pastLabel,
  nowLabel = 'HOJE',
  /** fotos de verdade; sem elas, as cenas desenhadas */
  pastUri,
  presentUri,
  height = 270,
}: {
  pastLabel: string;
  nowLabel?: string;
  pastUri?: string;
  presentUri?: string;
  height?: number;
}) {
  const motion = useMotionEnabled();
  const [width, setWidth] = useState(0);
  const [percent, setPercent] = useState(Math.round(START * 100));

  const x = useSharedValue(0);
  const startX = useSharedValue(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== width) {
      setWidth(w);
      x.value = w * START;
    }
  };

  const min = width * EDGE;
  const max = width * (1 - EDGE);

  const syncPercent = (px: number) => {
    if (width > 0) setPercent(Math.round((px / width) * 100));
  };

  const pan = Gesture.Pan()
    // só assume o gesto quando o movimento é horizontal — assim a ficha
    // continua rolando na vertical com o dedo em cima da foto
    .activeOffsetX([-8, 8])
    .failOffsetY([-12, 12])
    .onStart(() => {
      startX.value = x.value;
    })
    .onUpdate((e) => {
      x.value = clampPx(startX.value + e.translationX, min, max);
    })
    .onEnd(() => {
      runOnJS(syncPercent)(x.value);
    });

  const tap = Gesture.Tap().onEnd((e) => {
    const target = clampPx(e.x, min, max);
    x.value = motion ? withSpring(target, { damping: 18, stiffness: 180 }) : withTiming(target, { duration: 0 });
    runOnJS(syncPercent)(target);
  });

  const gesture = Gesture.Race(pan, tap);

  const pastStyle = useAnimatedStyle(() => ({ width: x.value }));
  const handleStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  /** Move o divisor por passos — é como quem usa leitor de tela opera isso. */
  const nudge = (dir: 1 | -1) => {
    const step = width * 0.1;
    const target = Math.min(Math.max(x.value + dir * step, min), max);
    x.value = motion ? withSpring(target, { damping: 18, stiffness: 180 }) : target;
    syncPercent(target);
  };

  return (
    <GestureDetector gesture={gesture}>
      <View style={[styles.wrap, { height }]} onLayout={onLayout}>
        {/* base: a vista de hoje, sempre inteira por baixo */}
        <PhotoPlaceholder variant="present" style={StyleSheet.absoluteFill}>
          {presentUri ? (
            <Image source={{ uri: presentUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <StreetScene variant="present" />
          )}
          <View style={[styles.cap, styles.capNow]}>
            <Mono style={styles.capText}>{nowLabel}</Mono>
          </View>
        </PhotoPlaceholder>

        {/* por cima: o passado, revelado até onde o divisor está */}
        <Animated.View style={[styles.pastClip, pastStyle]} pointerEvents="none">
          <View style={{ width: width || undefined, height }}>
            <PhotoPlaceholder variant="past" style={StyleSheet.absoluteFill}>
              {pastUri ? (
                <Image source={{ uri: pastUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <StreetScene variant="past" />
              )}
              <View style={[styles.cap, styles.capPast]}>
                <Mono style={styles.capText}>{pastLabel}</Mono>
              </View>
            </PhotoPlaceholder>
          </View>
        </Animated.View>

        <Animated.View style={[styles.handle, handleStyle]} pointerEvents="box-none">
          <View
            style={styles.knob}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={`Comparar ${pastLabel} com hoje`}
            accessibilityHint="Deslize para a direita para ver o passado, para a esquerda para ver hoje"
            accessibilityValue={{ min: 5, max: 95, now: percent }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(e) => {
              if (e.nativeEvent.actionName === 'increment') nudge(1);
              if (e.nativeEvent.actionName === 'decrement') nudge(-1);
            }}>
            <Icon name="handle" size={22} color={colors.esmalteFundo} strokeWidth={2.2} />
          </View>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden', position: 'relative' },
  pastClip: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' },
  cap: {
    position: 'absolute',
    bottom: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  capNow: { right: 14, backgroundColor: 'rgba(0,0,0,0.35)' },
  capPast: { left: 14, backgroundColor: 'rgba(94,60,36,0.5)' },
  capText: { fontSize: 11, letterSpacing: 1, color: '#FFFFFF' },
  handle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -1.5,
    width: 3,
    backgroundColor: colors.cal,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9,
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: colors.cal,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
  },
});
