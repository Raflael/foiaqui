import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, G, LinearGradient as SvgGradient, Line, Rect, Stop } from 'react-native-svg';

import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import { Body, Mono, Plaque } from '@/components/Type';
import { distanceTo, formatDistance } from '@/data/location';
import { useCurrentPosition } from '@/hooks/useCurrentPosition';
import { useMemorias } from '@/store/acervo';
import { useMotionEnabled } from '@/hooks/useMotion';
import { useSheet } from '@/store/sheet';
import { colors, HIT, radius, space } from '@/theme';
import type { Memory } from '@/types';

/**
 * A câmera volta sozinha ao mapa depois disso sem nenhum toque.
 *
 * Decisão 9 da pesquisa: "nunca deixar a AR ligada de forma contínua — entrar,
 * entregar o momento, sair". Uso contínuo cansa o braço, enjoa e queima bateria,
 * e foi um dos três medos declarados da PO.
 */
const IDLE_MS = 45_000;

/** Quantas memórias flutuam sobre a cena ao mesmo tempo. Mais que isso vira sopa. */
const CARDS_NA_CENA = 2;

/**
 * Câmera AR — *simulada* nesta fase.
 *
 * Não é ARKit/ARCore: é o preview da câmera com cards em posição absoluta,
 * exatamente como o mockup. AR de verdade é v3 no roadmap. O que esta tela
 * precisa provar agora é a leitura visual — "a memória flutua no lugar dela".
 */
export default function ARScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const insets = useSafeAreaInsets();
  const motion = useMotionEnabled();
  const openSheet = useSheet((s) => s.open);
  const { position } = useCurrentPosition();
  const memorias = useMemorias();

  /**
   * As memórias mais próximas de onde você está, e não duas cravadas no código.
   *
   * A posição dos cards na tela ainda é fixa — ancoragem geoespacial de verdade
   * é v3 no roadmap. Mas o CONTEÚDO já é o certo: o que está perto, com a
   * distância real. Um card dizendo "40 m" para algo a 400 km era a pior
   * mentira que restava no app.
   */
  const proximas = [...memorias]
    .sort((a, b) => distanceTo(a, position) - distanceTo(b, position))
    .slice(0, CARDS_NA_CENA);

  const [listOpen, setListOpen] = useState(false);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdle = useCallback(() => {
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => router.back(), IDLE_MS);
  }, []);

  useEffect(() => {
    resetIdle();
    return () => {
      if (idle.current) clearTimeout(idle.current);
    };
  }, [resetIdle]);

  /** Abre a memória e sai da câmera: o momento foi entregue. */
  const reveal = (id: string) => {
    openSheet(id);
    router.back();
  };

  const showCamera = permission?.granted === true;

  return (
    <View style={styles.screen} onTouchStart={resetIdle}>
      {showCamera ? (
        <CameraView style={StyleSheet.absoluteFill} facing="back" />
      ) : (
        <CityFallback />
      )}

      <GridOverlay />
      {motion ? <ScanLine /> : null}

      {/* retículo de mira */}
      <View style={styles.reticle} pointerEvents="none">
        <View style={[styles.reticleTick, styles.reticleTickTop]} />
        <View style={[styles.reticleTick, styles.reticleTickBottom]} />
      </View>

      {/* cards ancorados nos "prédios" */}
{proximas.map((m, i) => (
        <ARCard
          key={m.id}
          memory={m}
          distance={formatDistance(distanceTo(m, position))}
          style={i === 0 ? { left: 14, top: insets.top + 112 } : { right: 14, top: insets.top + 84 }}
          anchor={i === 0 ? 'left' : 'right'}
          delay={i * 1200}
          onPress={reveal}
        />
      ))}

      <Glass tone="dark" style={[styles.hint, { top: insets.top + space.md }]}>
        <Icon name="sparkle" size={18} color={colors.ferrugemClara} />
        <View style={{ flex: 1 }}>
          <Body style={styles.hintText}>Aponte para um prédio ou praça</Body>
          <Mono style={styles.hintNote}>volta ao mapa sozinha para poupar bateria</Mono>
        </View>
      </Glass>

      {listOpen ? (
        <View style={[styles.list, { paddingBottom: insets.bottom + space.md }]}>
          <Body style={styles.listTitle}>Memórias por perto</Body>
          <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
            {[...memorias]
              .sort((a, b) => distanceTo(a, position) - distanceTo(b, position))
              .map((m) => (
              <Pressable
                key={m.id}
                style={styles.listRow}
                onPress={() => reveal(m.id)}
                accessibilityRole="button"
                accessibilityLabel={`${m.title}, ${m.year}, ${m.place}`}>
                <PhotoPlaceholder variant="past" style={styles.listThumb} />
                <View style={{ flex: 1 }}>
                  <Plaque style={styles.listRowTitle}>{m.title}</Plaque>
                  <Mono style={styles.listRowMeta}>
                    {m.year} · {formatDistance(distanceTo(m, position))}
                  </Mono>
                </View>
                <Icon name="chevronRight" size={18} color={colors.sobreEsmalteDim} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {permission && !permission.granted ? (
        <View style={[styles.permission, { bottom: insets.bottom + 170 }]}>
          <Body style={styles.permissionText}>
            Sem acesso à câmera — mostrando uma cena de exemplo.
          </Body>
          {permission.canAskAgain ? (
            <Pressable
              onPress={requestPermission}
              style={styles.permissionBtn}
              accessibilityRole="button"
              accessibilityLabel="Permitir acesso à câmera">
              <Body style={styles.permissionBtnText}>Permitir câmera</Body>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/*
        Decisão 8: a AR é camada opcional e precisa ter sempre um caminho de
        saída e um equivalente sem câmera. Daí os dois botões lado a lado.
      */}
      <View style={[styles.exits, { bottom: insets.bottom + space.xxl }]}>
        <Pressable
          style={styles.exitBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar ao mapa">
          <Icon name="arrowLeft" size={17} color={colors.sobreEsmalte} />
          <Body style={styles.exitText}>Mapa</Body>
        </Pressable>

        <Pressable
          style={[styles.exitBtn, listOpen && styles.exitBtnOn]}
          onPress={() => setListOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: listOpen }}
          accessibilityLabel={
            listOpen ? 'Fechar a lista de memórias próximas' : 'Ver memórias próximas em lista'
          }>
          <Icon name="list" size={17} color={listOpen ? colors.sobreFerrugem : colors.sobreEsmalte} />
          <Body style={[styles.exitText, listOpen && { color: colors.sobreFerrugem }]}>Lista</Body>
        </Pressable>
      </View>
    </View>
  );
}

/** Card de memória flutuando sobre a cena, com fio e ponto de ancoragem. */
function ARCard({
  memory,
  distance,
  style,
  anchor,
  delay,
  onPress,
}: {
  memory: Memory;
  distance: string;
  style: { left?: number; right?: number; top: number };
  anchor: 'left' | 'right';
  delay: number;
  onPress: (id: string) => void;
}) {
  const motion = useMotionEnabled();
  const float = useSharedValue(0);

  useEffect(() => {
    if (!motion) {
      float.value = 0;
      return;
    }
    float.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
  }, [motion, delay, float]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -6 * float.value }],
  }));

  const tailSide = anchor === 'left' ? { left: 34 } : { right: 34 };
  const dotSide = anchor === 'left' ? { left: 29 } : { right: 29 };

  return (
    <Animated.View style={[styles.card, style, floatStyle]}>
      <Pressable
        style={styles.cardInner}
        onPress={() => onPress(memory.id)}
        accessibilityRole="button"
        accessibilityLabel={`${memory.title}, ${memory.year}, a ${distance}. Abrir memória.`}>
        <PhotoPlaceholder variant="past" style={styles.cardThumb} />
        <View style={{ flex: 1 }}>
          <Plaque style={styles.cardTitle} numberOfLines={1}>
            {memory.title}
          </Plaque>
          <Mono style={styles.cardMeta}>
            {memory.year} · {distance}
          </Mono>
        </View>
      </Pressable>
      <View style={[styles.tail, tailSide]} pointerEvents="none" />
      <View style={[styles.anchorDot, dotSide]} pointerEvents="none" />
    </Animated.View>
  );
}

/** Cena desenhada pra quando a câmera não está disponível (emulador, permissão negada). */
function CityFallback() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <SvgGradient id="arSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0B1120" />
            <Stop offset="0.55" stopColor="#1A2740" />
            <Stop offset="1" stopColor="#26364F" />
          </SvgGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#arSky)" />
      </Svg>

      <Svg
        style={styles.fallbackBuildings}
        width="100%"
        height="100%"
        viewBox="0 0 404 300"
        preserveAspectRatio="xMidYMax slice">
        <G fill="#26364F">
          <Rect x={-10} y={70} width={90} height={240} />
          <Rect x={86} y={120} width={70} height={200} />
          <Rect x={250} y={40} width={80} height={270} />
          <Rect x={332} y={110} width={90} height={200} />
        </G>
        <Rect x={150} y={150} width={105} height={160} fill="#2F4160" />
        {/* janelas acesas */}
        <G fill="#3A4D6E">
          <Rect x={10} y={100} width={12} height={16} />
          <Rect x={34} y={100} width={12} height={16} />
          <Rect x={58} y={100} width={12} height={16} />
          <Rect x={10} y={140} width={12} height={16} />
          <Rect x={34} y={140} width={12} height={16} />
          <Rect x={266} y={80} width={12} height={16} />
          <Rect x={290} y={80} width={12} height={16} />
          <Rect x={266} y={120} width={12} height={16} />
        </G>
      </Svg>
    </View>
  );
}

/**
 * Malha de "leitura do espaço". Ela some no topo e aparece embaixo:
 * as verticais usam um gradiente no traço, as horizontais recebem
 * opacidade calculada — sai mais barato que uma máscara.
 */
function GridOverlay() {
  const step = 30;
  const rows = Array.from({ length: 10 }, (_, i) => (i + 1) * step);
  const cols = Array.from({ length: 14 }, (_, i) => i * step);

  return (
    <Svg
      style={StyleSheet.absoluteFill}
      width="100%"
      height="100%"
      viewBox="0 0 404 300"
      preserveAspectRatio="xMidYMid slice"
      pointerEvents="none">
      <Defs>
        <SvgGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0.3" stopColor="#78AAFF" stopOpacity={0} />
          <Stop offset="1" stopColor="#78AAFF" stopOpacity={0.28} />
        </SvgGradient>
      </Defs>
      <G strokeWidth={1}>
        {cols.map((x) => (
          <Line key={`v${x}`} x1={x} y1={0} x2={x} y2={300} stroke="url(#gridFade)" />
        ))}
        {rows.map((y) => (
          <Line
            key={`h${y}`}
            x1={0}
            y1={y}
            x2={404}
            y2={y}
            stroke="#78AAFF"
            strokeOpacity={Math.max(0, (y / 300 - 0.3) / 0.7) * 0.28}
          />
        ))}
      </G>
    </Svg>
  );
}

/** Varredura âmbar descendo pela cena — o app "lendo" o lugar. */
function ScanLine() {
  const { height } = useWindowDimensions();
  const y = useSharedValue(-120);

  useEffect(() => {
    y.value = withRepeat(withTiming(height, { duration: 4000, easing: Easing.linear }), -1, false);
  }, [height, y]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return (
    <Animated.View style={[styles.scan, style]} pointerEvents="none">
      <LinearGradient
        colors={['rgba(180,71,31,0)', 'rgba(180,71,31,0.16)', 'rgba(180,71,31,0)']}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B1120' },
  fallbackBuildings: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },

  scan: { position: 'absolute', left: 0, right: 0, top: 0, height: 120 },

  reticle: {
    position: 'absolute',
    left: '50%',
    top: '44%',
    width: 46,
    height: 46,
    marginLeft: -23,
    marginTop: -23,
    borderWidth: 2,
    borderColor: 'rgba(244,243,238,0.75)',
    borderRadius: radius.md,
    zIndex: 10,
  },
  reticleTick: {
    position: 'absolute',
    left: '50%',
    marginLeft: -1,
    width: 2,
    height: 6,
    backgroundColor: colors.sobreEsmalte,
  },
  reticleTickTop: { top: -9 },
  reticleTickBottom: { bottom: -9 },

  hint: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.md,
    borderColor: colors.esmalteClaro,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  hintText: { fontSize: 13, fontWeight: '500', color: colors.sobreEsmalte },
  hintNote: { fontSize: 10, letterSpacing: 0.3, color: colors.sobreEsmalteDim, marginTop: 2 },

  list: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 24,
    backgroundColor: 'rgba(11,17,32,0.96)',
    borderTopWidth: 1,
    borderTopColor: colors.calLine,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    paddingTop: space.lg,
    paddingHorizontal: space.gutter,
  },
  listTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.sobreEsmalteDim,
    textTransform: 'uppercase',
    marginBottom: space.sm,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: HIT + 20,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.calLine,
  },
  listThumb: { width: 48, height: 48, borderRadius: radius.sm },
  listRowTitle: { fontSize: 15, color: colors.sobreEsmalte },
  listRowMeta: { fontSize: 10.5, color: colors.ferrugemClara, marginTop: 3 },

  card: { position: 'absolute', width: 214, zIndex: 16 },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(15,21,38,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(180,71,31,0.34)',
    borderRadius: radius.md,
    padding: 9,
    boxShadow: '0 14px 34px rgba(0,0,0,0.5)',
  },
  cardThumb: { width: 46, height: 46, borderRadius: radius.sm },
  cardTitle: { fontSize: 14, lineHeight: 16, color: colors.sobreEsmalte },
  cardMeta: { fontSize: 10.5, letterSpacing: 0.5, color: colors.ferrugemClara, marginTop: 3 },
  tail: { position: 'absolute', bottom: -30, width: 2, height: 30, backgroundColor: colors.ferrugem },
  anchorDot: {
    position: 'absolute',
    bottom: -36,
    width: 12,
    height: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.ferrugem,
    boxShadow: '0 0 12px rgba(180,71,31,0.85)',
  },

  permission: {
    position: 'absolute',
    left: space.xl,
    right: space.xl,
    zIndex: 22,
    alignItems: 'center',
    gap: space.md,
  },
  permissionText: {
    fontSize: 12.5,
    color: colors.sobreEsmalteDim,
    textAlign: 'center',
  },
  permissionBtn: {
    minHeight: HIT,
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.ferrugem,
  },
  permissionBtnText: { fontSize: 14, fontWeight: '700', color: colors.sobreFerrugem },

  exits: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 25,
    flexDirection: 'row',
    gap: space.sm,
  },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: HIT,
    minWidth: 110,
    paddingHorizontal: space.gutter,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.calLine,
    backgroundColor: 'rgba(15,21,38,0.9)',
  },
  exitBtnOn: { backgroundColor: colors.ferrugem, borderColor: colors.ferrugem },
  exitText: { fontSize: 13, fontWeight: '600', color: colors.sobreEsmalte },
});
