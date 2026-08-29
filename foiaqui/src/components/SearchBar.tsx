import { Pressable, StyleSheet, View } from 'react-native';

import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Body } from '@/components/Type';
import { colors, HIT, radius, space } from '@/theme';

/**
 * Busca do mapa. Nesta fase é um alvo de toque, não um input:
 * o teclado abrindo sobre o mapa não acrescenta nada ao protótipo de telas.
 */
export function SearchBar({
  placeholder = 'Buscar lugar, época ou tema',
  onPress,
  onFilterPress,
}: {
  placeholder?: string;
  onPress?: () => void;
  onFilterPress?: () => void;
}) {
  return (
    <Glass style={styles.bar}>
      <Pressable
        style={styles.field}
        onPress={onPress}
        accessibilityRole="search"
        accessibilityLabel={placeholder}>
        <Icon name="search" size={19} color={colors.grafiteDim} />
        <Body style={styles.placeholder} numberOfLines={1}>
          {placeholder}
        </Body>
      </Pressable>
      <Pressable
        onPress={onFilterPress}
        hitSlop={12}
        style={styles.filter}
        accessibilityRole="button"
        accessibilityLabel="Filtros de busca">
        <Icon name="filter" size={19} color={colors.ferrugem} />
      </Pressable>
    </Glass>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    paddingHorizontal: 15,
    minHeight: HIT + 4,
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
  },
  field: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 },
  placeholder: { flex: 1, color: colors.grafiteDim, fontSize: 14.5 },
  filter: { paddingLeft: space.sm, paddingVertical: 13 },
});
