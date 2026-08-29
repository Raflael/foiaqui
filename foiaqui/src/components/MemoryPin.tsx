import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Icon, type IconName } from '@/components/Icon';
import { Plaque as PlaquePlate } from '@/components/Plaque';
import { Plaque, Mono } from '@/components/Type';
import { useMotionEnabled } from '@/hooks/useMotion';
import { colors, HIT } from '@/theme';
import type { StubMapPos } from '@/types';

/**
 * O marcador do mapa é uma placa esmaltada em miniatura.
 *
 * Duas escolhas deliberadas:
 *
 * 1. Não é a gota genérica de mapa. A gota cabe igual num app de delivery;
 *    a chapa azul com moldura branca só cabe aqui.
 * 2. Não pulsa. O pin antigo tinha um halo âmbar piscando — vocabulário de
 *    app de corrida, e contradiz o que a placa é: um objeto parado no muro
 *    há sessenta anos. Sobre o mapa claro, o azul já salta sozinho.
 */
export function MemoryPin({
  pos,
  icon,
  label,
  accessibilityLabel,
  /** memória aberta na ficha: cresce e ganha a lasca de ferrugem */
  active = false,
  onPress,
}: {
  pos: StubMapPos;
  icon: IconName;
  label: string;
  accessibilityLabel: string;
  active?: boolean;
  onPress: () => void;
}) {
  const motion = useMotionEnabled();
  const lift = useSharedValue(0);

  useEffect(() => {
    const target = active ? 1 : 0;
    lift.value = motion ? withTiming(target, { duration: 180 }) : target;
  }, [active, motion, lift]);

  const plateStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + lift.value * 0.12 }],
  }));

  return (
    <Pressable
      style={[styles.pin, { left: pos.left, top: pos.top }]}
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel}>
      <Animated.View style={plateStyle}>
        <PlaquePlate chipped={active} style={styles.plate} frameStyle={styles.frame}>
          <View style={styles.row}>
            <Icon name={icon} size={13} color={colors.sobreEsmalte} strokeWidth={2} />
            <Plaque weight="semibold" style={styles.label}>
              {label}
            </Plaque>
          </View>
        </PlaquePlate>
      </Animated.View>

      {/* a farpa que aponta o ponto exato no chão */}
      <View style={styles.spike} />
      <View style={styles.dot} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pin: {
    position: 'absolute',
    alignItems: 'center',
    minWidth: HIT,
    zIndex: 15,
    // ancora a ponta da farpa na coordenada
    transform: [{ translateX: '-50%' }, { translateY: '-100%' }],
  },
  plate: {
    padding: 4,
    boxShadow: '0 4px 10px rgba(15,43,84,0.28)',
  },
  frame: { borderWidth: 1.5 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  label: { fontSize: 11.5, letterSpacing: 0.9, color: colors.sobreEsmalte },
  spike: { width: 2, height: 9, backgroundColor: colors.esmalte },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.esmalte,
    borderWidth: 1.5,
    borderColor: colors.sobreEsmalte,
    marginTop: -1,
  },
});
