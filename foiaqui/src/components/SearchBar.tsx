import { Pressable, StyleSheet } from 'react-native';

import { Glass } from '@/components/Glass';
import { Icon, type IconName } from '@/components/Icon';
import { Body } from '@/components/Type';
import { colors, HIT, radius, space } from '@/theme';

/**
 * Busca do mapa. Nesta fase é um alvo de toque, não um input:
 * o teclado abrindo sobre o mapa não acrescenta nada ao protótipo de telas.
 *
 * O botão da direita era um ícone de filtro que não fazia nada — os filtros
 * são os chips logo abaixo. Virou a alternância mapa↔lista, que é controle
 * de verdade e a Decisão 8 exige que exista sempre.
 */
export function SearchBar({
  placeholder = 'Buscar lugar, época ou tema',
  onPress,
  action,
}: {
  placeholder?: string;
  onPress?: () => void;
  action?: {
    icon: IconName;
    label: string;
    active?: boolean;
    onPress: () => void;
  };
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

      {action ? (
        <Pressable
          onPress={action.onPress}
          hitSlop={12}
          style={[styles.action, action.active && styles.actionOn]}
          accessibilityRole="button"
          accessibilityState={{ selected: !!action.active }}
          accessibilityLabel={action.label}>
          <Icon
            name={action.icon}
            size={19}
            color={action.active ? colors.sobreEsmalte : colors.esmalte}
          />
        </Pressable>
      ) : null}
    </Glass>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    paddingLeft: 15,
    paddingRight: 7,
    minHeight: HIT + 4,
    boxShadow: '0 8px 22px rgba(15,43,84,0.16)',
  },
  field: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 },
  placeholder: { flex: 1, color: colors.grafiteDim, fontSize: 14.5 },
  action: {
    minWidth: 38,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: space.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.esmalte,
  },
  actionOn: { backgroundColor: colors.esmalte },
});
