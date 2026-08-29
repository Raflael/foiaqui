import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Body, Mono } from '@/components/Type';
import { colors, radius } from '@/theme';

/**
 * Pílula selecionável: filtros do mapa, épocas e marcadores do fluxo de criar.
 *
 * Não há mais variante escura — o app inteiro é cal. O que varia é o `tone`,
 * que diz o que a seleção SIGNIFICA, seguindo a regra estrutural:
 *
 *   ferrugem = tempo   (época, recorte, "perto de mim")
 *   esmalte  = assunto (marcadores: o que a memória é)
 *
 * Canto reto, como toda chapa. Curva no app é exceção reservada ao corpo.
 */
export function Chip({
  label,
  active,
  tone = 'ferrugem',
  mono,
  style,
  onPress,
}: {
  label: string;
  active?: boolean;
  tone?: 'ferrugem' | 'esmalte';
  /** épocas usam mono — são datas */
  mono?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const Label = mono ? Mono : Body;
  const on = active ? (tone === 'ferrugem' ? styles.onFerrugem : styles.onEsmalte) : null;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.chip, on, pressed && { opacity: 0.75 }, style]}>
      <Label
        style={[
          styles.text,
          mono && styles.textMono,
          { color: active ? colors.sobreEsmalte : colors.grafite },
        ]}>
        {label}
      </Label>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.esmalte,
    backgroundColor: colors.cal,
  },
  onFerrugem: { backgroundColor: colors.ferrugem, borderColor: colors.ferrugem },
  onEsmalte: { backgroundColor: colors.esmalte, borderColor: colors.esmalte },
  text: { fontSize: 12.5 },
  textMono: { fontSize: 13, letterSpacing: 0 },
});
