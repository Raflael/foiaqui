import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { Plaque as PlaquePlate } from '@/components/Plaque';
import { Plaque } from '@/components/Type';
import { colors } from '@/theme';

/**
 * O marcador do mapa é uma placa esmaltada em miniatura.
 *
 * Duas escolhas deliberadas:
 *
 * 1. Não é a gota genérica de mapa. A gota cabe igual num app de delivery;
 *    a chapa azul com moldura branca só cabe aqui.
 * 2. Não pulsa. Halo piscando é vocabulário de app de corrida, e contradiz
 *    o que a placa é: um objeto parado no muro há sessenta anos. Sobre o
 *    mapa cal, o azul já salta sozinho.
 *
 * Só o visual — quem posiciona e escuta o toque é o `<Marker>`. A ponta do
 * pino fica na base da view, então o marcador usa `anchor={{ x: 0.5, y: 1 }}`.
 */
export function MemoryPin({
  icon,
  label,
  /** memória aberta na ficha: cresce e ganha a lasca de ferrugem */
  active = false,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
}) {
  return (
    <View style={styles.pin}>
      <View style={active && styles.lifted}>
        <PlaquePlate chipped={active} style={styles.plate} frameStyle={styles.frame}>
          <View style={styles.row}>
            <Icon name={icon} size={13} color={colors.sobreEsmalte} strokeWidth={2} />
            <Plaque weight="semibold" style={styles.label}>
              {label}
            </Plaque>
          </View>
        </PlaquePlate>
      </View>

      {/* a farpa que aponta o ponto exato no chão */}
      <View style={styles.spike} />
      <View style={styles.dot} />
    </View>
  );
}

const styles = StyleSheet.create({
  pin: { alignItems: 'center' },
  // escala em vez de animação: dentro de um Marker do Android, view animada
  // obriga o mapa a redesenhar o bitmap a cada quadro
  lifted: { transform: [{ scale: 1.12 }] },
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
