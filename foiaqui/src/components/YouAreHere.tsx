import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

/**
 * "Você está aqui". Único ponto neutro escuro do mapa — de propósito:
 * azul é memória, e você não é memória, é o presente olhando pra ela.
 *
 * Sem pulso. Pelo mesmo motivo dos pins: o mapa do FoiAqui é um lugar parado.
 */
export function YouAreHere() {
  return (
    <View style={styles.wrap}>
      <View style={styles.halo} />
      <View style={styles.core} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  halo: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(26,29,35,0.14)',
  },
  core: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: colors.voce,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
  },
});
