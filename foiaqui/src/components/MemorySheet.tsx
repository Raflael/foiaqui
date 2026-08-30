import { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { MemoryCard } from '@/components/MemoryCard';
import { Plaque as PlaquePlate } from '@/components/Plaque';
import { RevealSlider } from '@/components/RevealSlider';
import { Body, Mono, Plaque, Story } from '@/components/Type';
import { memories as seed } from '@/data/memories';
import { useMotionEnabled } from '@/hooks/useMotion';
import { useAcervo, useMemoria } from '@/store/acervo';
import { useSaved } from '@/store/saved';
import { useSheet, type Snap } from '@/store/sheet';
import { colors, HIT, radius, space } from '@/theme';
import type { Memory } from '@/types';

/** Alturas da forma de onda, em % — as mesmas do protótipo. */
const WAVE = [40, 70, 100, 55, 85, 45, 75, 60, 95, 50, 70, 40];

const formatDuration = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const SPRING = { damping: 22, stiffness: 200 } as const;

/**
 * A ficha de memória, como bottom sheet sobre o mapa (Decisão 2 da pesquisa).
 *
 * Vive na raiz do app, acima das abas, para funcionar de qualquer tela —
 * mapa, salvos ou trilhas — sem empilhar navegação. Três alturas:
 *
 *   espiada  — só o cabeçalho: época, título e endereço
 *   meio     — leitura confortável com o mapa ainda visível em cima
 *   cheia    — a memória inteira
 *
 * O arraste fica no cabeçalho, e não na folha toda, porque o corpo tem dois
 * gestos concorrentes: o scroll vertical e o arraste horizontal do slider
 * passado↔presente. Separar as áreas evita que um roube o outro.
 */
export function MemorySheet() {
  const { height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const motion = useMotionEnabled();

  const openId = useSheet((s) => s.openId);
  const snap = useSheet((s) => s.snap);
  const setSnap = useSheet((s) => s.setSnap);
  const close = useSheet((s) => s.close);
  const swap = useSheet((s) => s.swap);

  const savedIds = useSaved((s) => s.ids);
  const toggleSaved = useSaved((s) => s.toggle);
  const criadas = useAcervo((s) => s.criadas);

  // Segura a última memória durante a animação de saída, senão a folha
  // esvazia no meio do movimento.
  const encontrada = useMemoria(openId);
  const [shown, setShown] = useState<Memory | null>(null);
  useEffect(() => {
    if (encontrada) setShown(encontrada);
  }, [encontrada]);

  const [headerH, setHeaderH] = useState(200);
  const [playing, setPlaying] = useState(false);
  // Fora de cena de verdade: enquanto `hidden` for true a folha nem é montada.
  const [hidden, setHidden] = useState(true);
  const scroller = useRef<ScrollView>(null);

  const peekTop = Math.max(H - (headerH + insets.bottom + space.sm), H * 0.5);
  const tops = { full: H * 0.08, mid: H * 0.46, peek: peekTop };

  /**
   * Onde a folha estaciona quando fechada.
   *
   * Não basta `H`: no Android `useWindowDimensions` devolve a altura da JANELA,
   * que exclui a barra de navegação. Deslocar exatamente `H` deixava uma tira
   * de papel visível por cima da tab bar. Daí a folga.
   */
  const CLOSED = H + insets.bottom + 160;

  const y = useSharedValue(CLOSED);
  const startY = useSharedValue(0);

  useEffect(() => {
    if (openId) {
      if (hidden) {
        y.value = CLOSED; // ponto de partida da entrada
        setHidden(false);
      }
      const target = tops[snap];
      y.value = motion ? withSpring(target, SPRING) : target;
    } else if (!hidden) {
      if (motion) {
        y.value = withTiming(CLOSED, { duration: 220 }, (finished) => {
          if (finished) runOnJS(setHidden)(true);
        });
      } else {
        y.value = CLOSED;
        setHidden(true);
      }
    }
    // tops deriva de H/headerH/insets, já cobertos pelas dependências
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, snap, H, headerH, insets.bottom, motion, hidden, CLOSED]);

  // Sem isso, o botão voltar do Android fecha o app com a ficha aberta.
  useEffect(() => {
    if (!openId) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [openId, close]);

  useEffect(() => {
    setPlaying(false);
    scroller.current?.scrollTo({ y: 0, animated: false });
  }, [openId]);

  const pan = Gesture.Pan()
    .onStart(() => {
      startY.value = y.value;
    })
    .onUpdate((e) => {
      y.value = Math.min(Math.max(startY.value + e.translationY, tops.full), H);
    })
    .onEnd((e) => {
      // projeta onde o dedo "ia parar" para que um flick decida o destino
      const projected = y.value + e.velocityY * 0.12;

      if (projected > tops.peek + H * 0.09) {
        runOnJS(close)();
        return;
      }

      const options: { name: Snap; top: number }[] = [
        { name: 'full', top: tops.full },
        { name: 'mid', top: tops.mid },
        { name: 'peek', top: tops.peek },
      ];
      let best = options[0];
      for (const o of options) {
        if (Math.abs(projected - o.top) < Math.abs(projected - best.top)) best = o;
      }
      y.value = withSpring(best.top, SPRING);
      runOnJS(setSnap)(best.name);
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [tops.full, tops.peek], [0.55, 0], Extrapolation.CLAMP),
  }));

  /** Passos para quem opera por leitor de tela e não consegue arrastar. */
  const step = (dir: 1 | -1) => {
    const order: Snap[] = ['peek', 'mid', 'full'];
    const next = order[Math.min(Math.max(order.indexOf(snap) + dir, 0), order.length - 1)];
    setSnap(next);
  };

  if (!shown || hidden) return null;

  const saved = savedIds.includes(shown.id);
  const others = [...criadas, ...seed].filter((m) => m.id !== shown.id);
  const isOpen = openId !== null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? 'box-none' : 'none'}>
      {isOpen && snap !== 'peek' ? (
        <Animated.View style={[styles.scrim, scrimStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Fechar a memória e voltar ao mapa"
          />
        </Animated.View>
      ) : null}

      <Animated.View
        style={[styles.sheet, { height: H }, sheetStyle]}
        pointerEvents={isOpen ? 'auto' : 'none'}>
        <GestureDetector gesture={pan}>
          <View onLayout={(e: LayoutChangeEvent) => setHeaderH(e.nativeEvent.layout.height)}>
            <View
              style={styles.grabberZone}
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel={`Ficha de ${shown.title}`}
              accessibilityHint="Deslize para cima para ler a memória inteira, para baixo para ver o mapa"
              accessibilityValue={{ text: { peek: 'espiada', mid: 'meio', full: 'aberta' }[snap] }}
              accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
              onAccessibilityAction={(e) => {
                if (e.nativeEvent.actionName === 'increment') step(1);
                if (e.nativeEvent.actionName === 'decrement') step(-1);
              }}>
              <View style={styles.grabber} />
            </View>

            <View style={styles.tools}>
              <Mono style={styles.kind}>{shown.kind.toUpperCase()}</Mono>
              <View style={styles.headActions}>
                <RoundBtn
                  icon="bookmark"
                  label={saved ? 'Remover dos salvos' : 'Salvar memória'}
                  active={saved}
                  onPress={() => toggleSaved(shown.id)}
                />
                <RoundBtn icon="x" label="Fechar" onPress={close} />
              </View>
            </View>

            {/*
              O cabeçalho É a placa. A ordem é a da placa comemorativa real:
              o que aconteceu, o nome, o período, o endereço.
            */}
            <PlaquePlate chipped style={styles.plate}>
              <View style={styles.plateInner}>
                <Plaque weight="semibold" style={styles.marker}>
                  {shown.marker}
                </Plaque>
                <Plaque style={styles.title}>{shown.title}</Plaque>
                <View style={styles.periodRow}>
                  <Mono style={styles.period}>{shown.period}</Mono>
                  <View style={styles.rule} />
                </View>
                <Plaque weight="semibold" style={styles.address}>
                  {shown.place}
                </Plaque>
                {shown.status === 'em_revisao' ? (
                  <View style={styles.revisao}>
                    <Icon name="clock" size={13} color={colors.esmalte} strokeWidth={2.2} />
                    <Body style={styles.revisaoText}>
                      Em revisão pela comunidade — só você vê por enquanto
                    </Body>
                  </View>
                ) : null}
              </View>
            </PlaquePlate>
          </View>
        </GestureDetector>

        <ScrollView
          ref={scroller}
          scrollEnabled={snap !== 'peek'}
          contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }}
          showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <RevealSlider pastLabel={shown.year} pastUri={shown.pastImageUri} height={240} />
          </View>

          <View style={styles.body}>
            {shown.audioSeconds ? (
              <Pressable
                style={styles.audio}
                onPress={() => setPlaying((p) => !p)}
                accessibilityRole="button"
                accessibilityLabel={
                  playing
                    ? 'Pausar o relato em áudio'
                    : `Ouvir o relato de ${shown.author.name}, ${formatDuration(shown.audioSeconds)}`
                }>
                <View style={styles.audioPlay}>
                  <Icon name={playing ? 'pause' : 'play'} size={16} color="#FFFFFF" filled />
                </View>
                <View style={styles.wave}>
                  {WAVE.map((h, i) => (
                    <View
                      key={i}
                      style={[styles.waveBar, { height: `${h}%`, opacity: playing ? 0.85 : 0.5 }]}
                    />
                  ))}
                </View>
                <Mono style={styles.audioTime}>{formatDuration(shown.audioSeconds)}</Mono>
              </Pressable>
            ) : null}

            <StoryText story={shown.story} emphasis={shown.emphasis} />

            <View style={styles.byline}>
              <View style={styles.avatar}>
                <Plaque style={styles.avatarText}>{shown.author.name.charAt(0)}</Plaque>
              </View>
              <View style={{ flex: 1 }}>
                <Body style={styles.author}>{shown.author.name}</Body>
                <Mono style={styles.authorRole}>{shown.author.role}</Mono>
              </View>
              {shown.verified ? (
                <View style={styles.verified}>
                  <Icon name="checkCircle" size={15} color={colors.conferido} strokeWidth={2.4} />
                  <Body style={styles.verifiedText}>verificado</Body>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.actions}>
            <Action icon="share" label="Compartilhar" />
            <Action icon="timeline" label="Linha do tempo" />
            <Action icon="flag" label="Reportar" />
          </View>

          <Plaque style={styles.moreTitle}>Mais memórias deste local</Plaque>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moreRow}>
            {others.map((m) => (
              <MemoryCard
                key={m.id}
                memory={m}
                // troca o conteúdo da folha: sem navegação, sem recarregar tela
                onPress={() => {
                  swap(m.id);
                  scroller.current?.scrollTo({ y: 0, animated: motion });
                }}
              />
            ))}
          </ScrollView>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/** Destaca em Fraunces o trecho que abre a história — o "drop" do protótipo. */
function StoryText({ story, emphasis }: { story: string; emphasis?: string }) {
  if (!emphasis || !story.includes(emphasis)) {
    return <Story style={styles.story}>{story}</Story>;
  }
  const at = story.indexOf(emphasis);
  return (
    <Story style={styles.story}>
      {story.slice(0, at)}
      <Story weight="semibold" style={styles.storyEmphasis}>
        {emphasis}
      </Story>
      {story.slice(at + emphasis.length)}
    </Story>
  );
}

function RoundBtn({
  icon,
  label,
  active,
  onPress,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.roundBtn, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Icon
        name={icon}
        size={19}
        color={active ? colors.esmalte : colors.grafite}
        filled={active}
      />
    </Pressable>
  );
}

function Action({ icon, label }: { icon: IconName; label: string }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.action, pressed && { opacity: 0.75 }]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Icon name={icon} size={20} color={colors.grafite} />
      <Body style={styles.actionLabel}>{label}</Body>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#05070C',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: colors.cal,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    boxShadow: '0 -12px 40px rgba(0,0,0,0.55)',
  },

  grabberZone: { height: 26, alignItems: 'center', justifyContent: 'center' },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.calLine,
  },

  tools: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
    paddingBottom: space.md,
  },
  kind: { fontSize: 10.5, letterSpacing: 1.6, color: colors.grafiteDim },
  // sepia e nao emberDeep: alem de ser o token do passado, emberDeep sobre papel
  // da 2.74:1 e reprova no AA. sepia da 4.91:1.
  plate: { marginHorizontal: space.xl, boxShadow: '0 10px 26px rgba(15,43,84,0.30)' },
  plateInner: { paddingHorizontal: space.gutter, paddingVertical: space.lg },
  marker: { fontSize: 12, letterSpacing: 3.2, color: colors.sobreEsmalteDim },
  title: { fontSize: 32, lineHeight: 34, color: colors.sobreEsmalte, marginTop: 7 },
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md },
  period: { fontSize: 13, letterSpacing: 0.6, color: colors.sobreEsmalte },
  rule: { flexGrow: 1, height: 1, backgroundColor: 'rgba(244,243,238,0.34)' },
  address: { fontSize: 12.5, letterSpacing: 1.2, color: colors.sobreEsmalteDim, marginTop: space.sm },
  revisao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: space.md,
    paddingHorizontal: space.sm,
    paddingVertical: 6,
    backgroundColor: colors.sobreEsmalte,
  },
  revisaoText: { flex: 1, fontSize: 11.5, fontWeight: '600', color: colors.esmalte },
  headActions: { flexDirection: 'row', gap: space.sm },
  roundBtn: {
    width: HIT,
    height: HIT,
    borderRadius: HIT / 2,
    backgroundColor: colors.cal2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  hero: { marginHorizontal: 22, borderRadius: radius.md, overflow: 'hidden' },
  body: { paddingHorizontal: 22 },

  audio: {
    marginTop: space.gutter,
    minHeight: HIT + 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.cal2,
    borderWidth: 1,
    borderColor: colors.calLine,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  audioPlay: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.esmalte,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: { flex: 1, height: 26, flexDirection: 'row', alignItems: 'center', gap: 3 },
  waveBar: { flex: 1, backgroundColor: colors.esmalte, borderRadius: 2 },
  audioTime: { fontSize: 11, color: colors.grafiteDim },

  story: { marginTop: space.gutter, fontSize: 17, lineHeight: 27, color: colors.grafite },
  storyEmphasis: { fontSize: 17, lineHeight: 27, color: colors.grafite },

  byline: {
    marginTop: space.gutter,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.calLine,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.esmalte,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, color: '#FFFFFF' },
  author: { fontSize: 13.5, fontWeight: '700', color: colors.grafite },
  authorRole: { fontSize: 11.5, letterSpacing: 0.3, color: colors.grafiteDim },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  verifiedText: { fontSize: 11, fontWeight: '700', color: colors.conferido },

  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 22, paddingTop: space.lg },
  action: {
    flex: 1,
    minHeight: HIT + 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.cal2,
    borderWidth: 1,
    borderColor: colors.calLine,
    borderRadius: radius.md,
    paddingVertical: 11,
    paddingHorizontal: 4,
  },
  actionLabel: { fontSize: 11.5, fontWeight: '600', color: colors.grafite, textAlign: 'center' },

  moreTitle: { fontSize: 17, color: colors.grafite, paddingHorizontal: 22, paddingTop: space.xxl },
  moreRow: { gap: space.md, paddingHorizontal: 22, paddingTop: 10, paddingBottom: space.xl },
});
