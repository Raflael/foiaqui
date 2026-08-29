import { Pressable, StyleSheet, TextInput } from 'react-native';

import { Glass } from '@/components/Glass';
import { Icon, type IconName } from '@/components/Icon';
import { useTypeScale } from '@/store/settings';
import { colors, fonts, HIT, radius, space } from '@/theme';

/**
 * Busca do mapa: lugar, época ou tema.
 *
 * O botão da direita não é filtro — os filtros são os chips logo abaixo.
 * É a alternância mapa↔lista, controle que a Decisão 8 exige que exista sempre.
 *
 * O "x" só aparece com texto digitado: botão que não faz nada ocupa alvo de
 * toque e ensina a pessoa a desconfiar da interface.
 */
export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar lugar, época ou tema',
  action,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  action?: {
    icon: IconName;
    label: string;
    active?: boolean;
    onPress: () => void;
  };
}) {
  const scale = useTypeScale();

  return (
    <Glass style={styles.bar}>
      <Icon name="search" size={19} color={colors.grafiteDim} />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.grafiteDim}
        style={[styles.input, { fontSize: 14.5 * scale }]}
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="never"
        accessibilityLabel={placeholder}
      />

      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={12}
          style={styles.clear}
          accessibilityRole="button"
          accessibilityLabel="Limpar a busca">
          <Icon name="x" size={16} color={colors.grafiteDim} strokeWidth={2.2} />
        </Pressable>
      ) : null}

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
    gap: 10,
    borderRadius: radius.md,
    paddingLeft: 15,
    paddingRight: 7,
    minHeight: HIT + 4,
    boxShadow: '0 8px 22px rgba(15,43,84,0.16)',
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontFamily: fonts.ui.regular,
    color: colors.grafite,
  },
  clear: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  action: {
    minWidth: 38,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: space.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.esmalte,
  },
  actionOn: { backgroundColor: colors.esmalte },
});
