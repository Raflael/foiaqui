import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useSettings } from '@/store/settings';
import { alpha, colors } from '@/theme';

/**
 * Superfície de vidro que flutua sobre o mapa e sobre a câmera.
 *
 * `tone` existe porque os dois fundos são opostos: o mapa é cal (claro e
 * previsível), a câmera é o mundo (imprevisível, quase sempre mais claro que
 * a interface). Sobre a câmera o chrome precisa ser escuro para o texto
 * sobreviver a qualquer cena.
 *
 * No "modo simples" o blur sai e vira fundo opaco: mais contraste, menos GPU,
 * texto mais legível na rua.
 */
export function Glass({
  style,
  intensity = 24,
  tone = 'light',
  children,
}: {
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tone?: 'light' | 'dark';
  children?: ReactNode;
}) {
  const simpleMode = useSettings((s) => s.simpleMode);
  const dark = tone === 'dark';

  const border = { borderColor: dark ? colors.esmalteClaro : colors.calLine };
  const solid = { backgroundColor: dark ? alpha.glassDark : alpha.glass };

  if (simpleMode) {
    return <View style={[styles.base, border, solid, style]}>{children}</View>;
  }

  return (
    <BlurView intensity={intensity} tint={dark ? 'dark' : 'light'} style={[styles.base, border, style]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: dark ? 'rgba(15,43,84,0.62)' : 'rgba(244,243,238,0.66)' }]} />
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderWidth: 1,
  },
});
