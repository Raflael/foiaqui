import { useId, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

/**
 * Enquanto não há fotos reais, toda "foto" do app é desenhada:
 * - `past`    → gradiente sépia com grão, o passado
 * - `present` → cinza-frio, a vista de hoje
 *
 * Mesma dupla do protótipo (`.oldphoto` / `.nowphoto`). Quando entrarem
 * imagens de verdade, só este componente muda.
 */
export function PhotoPlaceholder({
  variant,
  grain = variant === 'past',
  style,
  children,
}: {
  variant: 'past' | 'present';
  grain?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  // useId() devolve algo como ":r3:" — os dois-pontos quebram o url(#id) do SVG.
  const uid = useId().replace(/:/g, '');
  const fillId = `fill-${uid}`;
  const grainId = `grain-${uid}`;

  return (
    <View style={[styles.wrap, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          {variant === 'past' ? (
            <RadialGradient id={fillId} cx="30%" cy="20%" rx="120%" ry="120%">
              <Stop offset="0" stopColor="#B8895A" />
              <Stop offset="0.45" stopColor="#8A5A38" />
              <Stop offset="1" stopColor="#5E3C24" />
            </RadialGradient>
          ) : (
            <LinearGradient id={fillId} x1="0.9" y1="0" x2="0.15" y2="1">
              <Stop offset="0" stopColor="#7F8EA3" />
              <Stop offset="0.55" stopColor="#54627A" />
              <Stop offset="1" stopColor="#3C4658" />
            </LinearGradient>
          )}
          <Pattern id={grainId} width={3} height={3} patternUnits="userSpaceOnUse">
            <Circle cx={1} cy={1} r={0.5} fill="#FFFFFF" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${fillId})`} />
        {grain ? <Rect width="100%" height="100%" fill={`url(#${grainId})`} opacity={0.16} /> : null}
      </Svg>
      {children}
    </View>
  );
}

/**
 * A rua desenhada, em duas épocas — o conteúdo do slider passado↔presente.
 *
 * Sem isso o slider revela "sépia virando cinza", que não conta história
 * nenhuma. Com os prédios, o arraste mostra a marquise do cinema dando
 * lugar a uma fachada de janelas: é a mudança que o produto promete.
 *
 * Genérico de propósito — serve as três memórias do mock. Sai inteiro
 * quando entrarem fotos de verdade.
 */
export function StreetScene({ variant }: { variant: 'past' | 'present' }) {
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      width="100%"
      height="100%"
      viewBox="0 0 404 270"
      preserveAspectRatio="xMidYMid slice"
      pointerEvents="none">
      {variant === 'past' ? (
        <>
          <G fill="#5E3C24" opacity={0.55}>
            <Rect x={18} y={80} width={100} height={190} />
            <Rect x={248} y={60} width={120} height={210} />
          </G>
          <Rect x={118} y={70} width={130} height={200} fill="#6E4526" opacity={0.7} />
          {/* a marquise iluminada do cinema — o detalhe que data a foto */}
          <Rect x={118} y={118} width={130} height={26} fill="#C79A5F" opacity={0.8} />
          <G fill="#3A2413" opacity={0.8}>
            <Rect x={150} y={150} width={16} height={30} />
            <Rect x={176} y={150} width={16} height={30} />
            <Rect x={202} y={150} width={16} height={30} />
          </G>
          <Rect x={0} y={252} width={404} height={18} fill="#3A2413" />
        </>
      ) : (
        <>
          <G fill="#59667D">
            <Rect x={20} y={90} width={90} height={180} />
            <Rect x={250} y={70} width={120} height={200} />
          </G>
          <Rect x={120} y={120} width={120} height={150} fill="#4B586E" />
          {/* onde havia marquise, agora há janelas */}
          <G fill="#6F7C92" opacity={0.8}>
            <Rect x={132} y={140} width={18} height={24} />
            <Rect x={160} y={140} width={18} height={24} />
            <Rect x={188} y={140} width={18} height={24} />
            <Rect x={132} y={180} width={18} height={24} />
            <Rect x={160} y={180} width={18} height={24} />
          </G>
          <Rect x={0} y={250} width={404} height={20} fill="#39445A" />
        </>
      )}
    </Svg>
  );
}

/** Atalhos com os nomes do protótipo. */
export const OldPhoto = (props: Omit<Parameters<typeof PhotoPlaceholder>[0], 'variant'>) => (
  <PhotoPlaceholder variant="past" {...props} />
);
export const NowPhoto = (props: Omit<Parameters<typeof PhotoPlaceholder>[0], 'variant'>) => (
  <PhotoPlaceholder variant="present" {...props} />
);

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
});
