import { StyleSheet, Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { useTypeScale } from '@/store/settings';
import {
  colors,
  fonts,
  PLAQUE_TRACKING,
  size,
  type PlaqueWeight,
  type StoryWeight,
  type UIWeight,
} from '@/theme';

type BaseProps = Omit<TextProps, 'style'> & { style?: StyleProp<TextStyle> };

/**
 * Aplica o fator de "fonte grande" em cima do `fontSize`/`lineHeight` que veio
 * no style. Fica DEPOIS do style do chamador na cascata, então sempre vence.
 */
function useScaled(style: StyleProp<TextStyle>, fallback: number): TextStyle {
  const scale = useTypeScale();
  const flat = StyleSheet.flatten(style) ?? {};
  const fontSize = (typeof flat.fontSize === 'number' ? flat.fontSize : fallback) * scale;
  const lineHeight =
    typeof flat.lineHeight === 'number' ? flat.lineHeight * scale : undefined;
  return lineHeight ? { fontSize, lineHeight } : { fontSize };
}

/**
 * A letra da placa: Archivo Narrow em caixa alta, condensada e espaçada.
 * Condensada porque nome de rua tem que caber em chapa estreita — é a razão
 * de existir da forma, não um efeito.
 *
 * O texto é convertido para maiúsculas aqui, não pelo chamador: placa não tem
 * caixa baixa.
 */
export function Plaque({
  weight = 'bold',
  style,
  children,
  ...rest
}: BaseProps & { weight?: PlaqueWeight }) {
  const scaled = useScaled(style, size.plaque);
  const upper = typeof children === 'string' ? children.toUpperCase() : children;
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: fonts.plaque[weight],
          // grafite e nao sobreEsmalte: o chao do app e cal. Quem fica sobre a
          // chapa azul (pin, cabecalho da ficha) declara a cor clara na hora.
          color: colors.grafite,
          letterSpacing: PLAQUE_TRACKING,
        },
        style,
        scaled,
      ]}>
      {upper}
    </Text>
  );
}

/** Newsreader — a voz de quem viveu. Só para relato e citação, nunca para UI. */
export function Story({ weight = 'regular', style, ...rest }: BaseProps & { weight?: StoryWeight }) {
  const scaled = useScaled(style, size.story);
  return (
    <Text
      {...rest}
      style={[{ fontFamily: fonts.story[weight], color: colors.grafite }, style, scaled]}
    />
  );
}

/** Archivo — toda a interface: rótulos, botões, listas. */
export function Body({ weight = 'regular', style, ...rest }: BaseProps & { weight?: UIWeight }) {
  const scaled = useScaled(style, size.body);
  return (
    <Text
      {...rest}
      style={[{ fontFamily: fonts.ui[weight], color: colors.grafite }, style, scaled]}
    />
  );
}

/** DM Mono — datas, anos, coordenadas, número de acervo. O que é registro. */
export function Mono({ style, ...rest }: BaseProps) {
  const scaled = useScaled(style, size.micro);
  return (
    <Text
      {...rest}
      style={[{ fontFamily: fonts.mono.regular, color: colors.grafiteDim }, style, scaled]}
    />
  );
}

/** Rótulo curto em maiúsculas: "PERCURSOS", "AQUI FUNCIONOU". */
export function Eyebrow({ style, ...rest }: BaseProps) {
  const scaled = useScaled(style, size.eyebrow);
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: fonts.plaque.semibold,
          fontSize: size.eyebrow,
          letterSpacing: 2.4,
          textTransform: 'uppercase',
          color: colors.ferrugem,
        },
        style,
        scaled,
      ]}
    />
  );
}
