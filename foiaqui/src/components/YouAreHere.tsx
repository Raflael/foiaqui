import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useMotionEnabled } from '@/hooks/useMotion';
import { colors } from '@/theme';

const RING = 54;

/**
 * "Você está aqui". Único ponto azul do app — de propósito:
 * âmbar é memória, azul é o presente. Não vira pin.
 */
export function YouAreHere({ left, top }: { left: `${number}%`; top: `${number}%` }) {
  const motion = useMotionEnabled();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!motion) {
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [motion, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + pulse.value * 0.4,
    transform: [{ scale: 0.85 + pulse.value * 0.3 }],
  }));

  return (
    <View
      style={[styles.wrap, { left, top }]}
      pointerEvents="none"
      accessibilityLabel="Sua localização atual">
      <Animated.View style={[styles.ring, ringStyle]}>
        <Svg width={RING} height={RING}>
          <Defs>
            <RadialGradient id="meRing" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={colors.voce} stopOpacity={0.22} />
              <Stop offset="0.7" stopColor={colors.voce} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={RING / 2} cy={RING / 2} r={RING / 2} fill="url(#meRing)" />
        </Svg>
      </Animated.View>
      <View style={styles.core} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 14,
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
  },
  ring: { position: 'absolute', width: RING, height: RING },
  core: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.voce,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
  },
});
