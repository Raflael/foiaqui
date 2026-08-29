import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, FRAME, FRAME_INSET, radius } from '@/theme';

/**
 * A chapa esmaltada — o componente-assinatura do FoiAqui.
 *
 * Duas camadas, como o objeto real: a chapa (esmalte azul) e a moldura branca
 * embutida a alguns milímetros da borda. É essa moldura que substitui o
 * retângulo arredondado genérico como linguagem de container do app.
 *
 * `chipped` acrescenta a lasca de esmalte na lateral — a marca do tempo que
 * toda placa velha tem. Usada só na memória aberta, para não virar enfeite.
 */
export function Plaque({
  children,
  chipped,
  tone = 'esmalte',
  style,
  frameStyle,
}: {
  children?: ReactNode;
  chipped?: boolean;
  /** `cal` inverte: chapa clara com moldura escura, para superfícies sobre o azul */
  tone?: 'esmalte' | 'cal';
  style?: StyleProp<ViewStyle>;
  frameStyle?: StyleProp<ViewStyle>;
}) {
  const plate = tone === 'esmalte' ? colors.esmalte : colors.cal;
  const frame = tone === 'esmalte' ? colors.sobreEsmalte : colors.esmalte;

  return (
    <View style={[styles.plate, { backgroundColor: plate }, style]}>
      <View style={[styles.frame, { borderColor: frame }, frameStyle]}>{children}</View>
      {chipped ? <View style={styles.chip} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    padding: FRAME_INSET,
    borderRadius: radius.none,
  },
  frame: {
    borderWidth: FRAME,
    borderRadius: radius.none,
  },
  // a lasca: o esmalte descasca e aparece o ferro oxidado por baixo
  chip: {
    position: 'absolute',
    right: -4,
    top: 34,
    width: 9,
    height: 26,
    backgroundColor: colors.ferrugem,
  },
});
