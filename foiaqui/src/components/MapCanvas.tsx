import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

/**
 * Mapa stub: quarteirões, ruas, avenida e rio desenhados em SVG.
 *
 * Claro, e não escuro. A Decisão 7 da pesquisa diz que o uso real é "sol na
 * tela, mão ocupada" — mapa escuro sob sol direto é pior de ler, e a persona
 * principal tem 70 anos. O escuro anterior era poético, não funcional.
 *
 * Continua stub porque `react-native-maps` precisa de código nativo e não roda
 * no Expo Go. Trocar depois é local: este componente vira o `<MapView>` com um
 * estilo custom nestes mesmos tons, e os pins viram `<Marker>`.
 */
export function MapCanvas({ children }: { children?: ReactNode }) {
  return (
    <View style={styles.canvas}>
      <Svg
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        viewBox="0 0 404 760"
        preserveAspectRatio="xMidYMid slice">
        <Rect width="404" height="760" fill={colors.mapaFundo} />

        {/* quarteirões */}
        <G fill={colors.mapaQuarteirao}>
          <Rect x={-10} y={120} width={120} height={120} />
          <Rect x={130} y={90} width={140} height={90} />
          <Rect x={292} y={120} width={130} height={150} />
          <Rect x={-10} y={270} width={95} height={150} />
          <Rect x={250} y={300} width={170} height={130} />
          <Rect x={120} y={330} width={90} height={120} />
          <Rect x={-10} y={450} width={150} height={140} />
          <Rect x={300} y={470} width={120} height={150} />
          <Rect x={150} y={500} width={120} height={120} />
          <Rect x={20} y={620} width={150} height={150} />
          <Rect x={230} y={650} width={180} height={150} />
        </G>

        {/* ruas — claras sobre os quarteirões, como planta de cidade */}
        <G stroke={colors.mapaRua} strokeWidth={14} fill="none" strokeLinecap="square">
          <Path d="M-20 250 H430" />
          <Path d="M-20 435 H430" />
          <Path d="M-20 600 H430" />
          <Path d="M110 -20 V800" />
          <Path d="M282 -20 V800" />
        </G>

        <Path
          d="M-30 700 L440 200"
          stroke={colors.mapaAvenida}
          strokeWidth={20}
          fill="none"
          strokeLinecap="square"
        />

        <Path
          d="M-30 40 C120 90 90 200 250 250 S440 360 470 330"
          stroke={colors.mapaAgua}
          strokeWidth={26}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.mapaFundo,
  },
});
