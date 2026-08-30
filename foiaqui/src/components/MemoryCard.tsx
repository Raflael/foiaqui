import { Pressable, StyleSheet, View } from 'react-native';

import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import { Body, Mono, Plaque } from '@/components/Type';
import { colors, radius, space } from '@/theme';
import type { Memory } from '@/types';

/**
 * Card horizontal de memória ("mais memórias deste local").
 * `surface` existe porque o mesmo card aparece sobre papel (ficha) e sobre o escuro.
 */
export function MemoryCard({
  memory,
  surface = 'paper',
  distance,
  onPress,
}: {
  memory: Memory;
  surface?: 'paper' | 'dark';
  /** quando vem, substitui o autor — perto de onde? é a pergunta desta lista */
  distance?: string;
  onPress: () => void;
}) {
  const onSurface = surface === 'paper' ? colors.grafite : colors.grafite;
  // emberDeep sobre papel da 2.74:1 e reprova no AA; sepia da 4.91:1.
  // Sobre o escuro, emberDeep passa folgado (5.67:1).
  // ano e autor sao registro, nao acao: azul, nunca ferrugem
  const metaColor = colors.esmalte;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
      accessibilityRole="button"
      accessibilityLabel={`${memory.title}, ${memory.year}${
        distance ? `, a ${distance}` : `, por ${memory.author.name}`
      }`}>
      <PhotoPlaceholder variant="past" style={styles.thumb}>
        <View style={styles.year}>
          <Mono style={styles.yearText}>{memory.year}</Mono>
        </View>
      </PhotoPlaceholder>
      <Plaque style={[styles.title, { color: onSurface }]} numberOfLines={2}>
        {memory.title}
      </Plaque>
      <Mono style={[styles.author, { color: metaColor }]} numberOfLines={1}>
        {distance ?? memory.author.name}
      </Mono>
    </Pressable>
  );
}

/** Linha de lista: usada em Salvos e na visão de lista do mapa. */
export function MemoryRow({
  memory,
  distance,
  onPress,
}: {
  memory: Memory;
  /** quando vem, substitui o autor na linha de dados — na rua a distância importa mais */
  distance?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.cal2 }]}
      accessibilityRole="button"
      accessibilityLabel={`${memory.title}, ${memory.place}, ${memory.year}${
        distance ? `, a ${distance}` : ''
      }`}>
      <PhotoPlaceholder variant="past" style={styles.rowThumb} />
      <View style={styles.rowText}>
        <Plaque style={styles.rowTitle}>{memory.title}</Plaque>
        <Body style={styles.rowPlace}>{memory.place}</Body>
        <Mono style={styles.rowMeta}>
          {memory.year} · {distance ?? memory.author.name}
        </Mono>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 138 },
  thumb: { width: 138, height: 96, borderRadius: radius.md },
  year: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  yearText: { fontSize: 10, color: '#FFFFFF' },
  title: { fontSize: 14, lineHeight: 16, marginTop: space.sm },
  author: { fontSize: 10.5, marginTop: 3 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: space.gutter,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.calLine,
  },
  rowThumb: { width: 64, height: 64, borderRadius: radius.md },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16 },
  rowPlace: { fontSize: 12.5, color: colors.grafiteDim, marginTop: 3 },
  rowMeta: { fontSize: 10.5, color: colors.esmalte, marginTop: 4 },
});
