import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/Chip';
import { Glass } from '@/components/Glass';
import { Icon, type IconName } from '@/components/Icon';
import { MapCanvas } from '@/components/MapCanvas';
import { MemoryPin } from '@/components/MemoryPin';
import { SearchBar } from '@/components/SearchBar';
import { Body, Mono } from '@/components/Type';
import { YouAreHere } from '@/components/YouAreHere';
import { mapFilters, memories } from '@/data/memories';
import { useMotionEnabled } from '@/hooks/useMotion';
import { useSettings } from '@/store/settings';
import { useSheet } from '@/store/sheet';
import { colors, HIT, radius, space, TABBAR_HEIGHT } from '@/theme';

/** Cada memória ganha o ícone do que ela foi. Com dados reais isso viria da categoria. */
const PIN_ICONS: Record<string, IconName> = {
  cine: 'film',
  praca: 'bandstand',
  mural: 'circlePlus',
};

/** Onde o pin aberto deve ficar: alto o bastante para sobrar mapa acima da folha. */
const FOCUS_AT = 0.24;
/** Teto do deslocamento, para o mapa nunca deixar borda vazia à mostra. */
const MAX_SHIFT = 0.4;
/** Topo da folha na altura "meio" — precisa bater com `tops.mid` do MemorySheet. */
const SHEET_MID = 0.46;

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { height: H } = useWindowDimensions();
  const motion = useMotionEnabled();

  // null = sem recorte, mostra tudo. Chip clicado de novo limpa o filtro:
  // na rua a pessoa precisa desfazer sem procurar um "x".
  const [filterId, setFilterId] = useState<string | null>(null);
  const coachDismissed = useSettings((s) => s.coachDismissed);
  const dismissCoach = useSettings((s) => s.dismissCoach);

  const openId = useSheet((s) => s.openId);
  const snap = useSheet((s) => s.snap);
  const openSheet = useSheet((s) => s.open);

  const floorGap = TABBAR_HEIGHT + insets.bottom + space.xl;

  const filter = mapFilters.find((f) => f.id === filterId) ?? null;
  const shown = filter ? memories.filter(filter.match) : memories;

  /**
   * Quando a ficha sobe, o mapa desliza para trazer o pin aberto à faixa que
   * continua visível. É o que sustenta a promessa da Decisão 2: a memória abre
   * sem que a pessoa perca de vista onde ela fica.
   *
   * Duas sutilezas que evitam movimento gratuito:
   * - só desliza se o pin realmente ficaria atrás da folha;
   * - a referência é sempre a altura "meio", então passar de meio para cheia
   *   (onde o mapa nem aparece) não mexe o mapa de novo.
   */
  const selected = shown.find((m) => m.id === openId);
  const pinY = selected ? (parseFloat(selected.mapPos.top) / 100) * H : 0;
  const coveredFrom = H * SHEET_MID - 72;
  const shift =
    selected && snap !== 'peek' && pinY > coveredFrom
      ? Math.max(Math.min(H * FOCUS_AT - pinY, H * MAX_SHIFT), -H * MAX_SHIFT)
      : 0;

  const mapStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: motion
          ? withSpring(shift, { damping: 20, stiffness: 140 })
          : withTiming(shift, { duration: 0 }),
      },
    ],
  }));

  return (
    <View style={styles.screen}>
      <Animated.View style={[StyleSheet.absoluteFill, mapStyle]}>
        <MapCanvas>
          {shown.map((memory) => (
            <MemoryPin
              key={memory.id}
              pos={memory.mapPos}
              icon={PIN_ICONS[memory.id] ?? 'pin'}
              label={`${memory.shortName} · ${memory.year}`}
              accessibilityLabel={`, . Abrir memória.`}
              active={memory.id === openId}
              onPress={() => openSheet(memory.id)}
            />
          ))}
          <YouAreHere left="47%" top="63%" />
        </MapCanvas>
      </Animated.View>

      <View style={[styles.top, { top: insets.top + space.md }]}>
        <SearchBar />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          {mapFilters.map((f) => (
            <Chip
              key={f.id}
              label={f.label}
              active={filterId === f.id}
              onPress={() => setFilterId((cur) => (cur === f.id ? null : f.id))}
            />
          ))}
        </ScrollView>
      </View>

      <Glass style={[styles.count, { bottom: floorGap }]}>
        {shown.length === 0 ? (
          <Body style={styles.countText}>
            Nenhuma memória <Body style={styles.countStrong}>{filter?.countLabel}</Body> por aqui.
            Que tal contar a primeira?
          </Body>
        ) : (
          <Body style={styles.countText}>
            <Mono style={styles.countNumber}>{shown.length}</Mono>{' '}
            {shown.length === 1 ? 'memória' : 'memórias'}
            {filter ? ` ${filter.countLabel}` : ' neste quarteirão'}
          </Body>
        )}
      </Glass>

      {!coachDismissed ? (
        <Pressable
          style={[styles.coach, { bottom: floorGap + 66 + space.md }]}
          onPress={dismissCoach}
          accessibilityRole="button"
          accessibilityLabel="Toque na câmera para ver as memórias em realidade aumentada. Toque aqui para dispensar esta dica.">
          <Body style={styles.coachText}>
            <Body style={styles.coachStrong}>Toque na câmera</Body> para ver as memórias em
            realidade aumentada, no próprio lugar.
          </Body>
          <View style={styles.coachTail} />
        </Pressable>
      ) : null}

      <Pressable
        style={[styles.camFab, { bottom: floorGap }]}
        onPress={() => router.push('/ar')}
        accessibilityRole="button"
        accessibilityLabel="Abrir câmera em realidade aumentada">
        <LinearGradient
          colors={[colors.ferrugemClara, colors.ferrugem, colors.ferrugem]}
          locations={[0, 0.6, 1]}
          start={{ x: 0.35, y: 0.3 }}
          end={{ x: 1, y: 1 }}
          // arredonda o próprio gradiente: o container precisa de overflow
          // visível pro selo "AR" poder escapar do canto
          style={[StyleSheet.absoluteFill, { borderRadius: radius.md }]}
        />
        <Icon name="camera" size={30} color={colors.sobreFerrugem} strokeWidth={2.2} />
        <View style={styles.camBadge}>
          <Mono style={styles.camBadgeText}>AR</Mono>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cal },

  top: { position: 'absolute', left: space.lg, right: space.lg, zIndex: 20, gap: space.md },
  chips: { gap: space.sm, paddingRight: space.lg },

  count: {
    position: 'absolute',
    left: space.lg,
    zIndex: 20,
    borderRadius: radius.md,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  countText: { fontSize: 12, color: colors.grafiteDim },
  countNumber: { fontSize: 12, color: colors.esmalte, fontWeight: '700' },
  countStrong: { fontSize: 12, color: colors.grafite, fontWeight: '600' },

  coach: {
    position: 'absolute',
    right: space.xl,
    zIndex: 30,
    maxWidth: 190,
    backgroundColor: colors.cal,
    borderRadius: radius.md,
    paddingHorizontal: 13,
    paddingVertical: 11,
    boxShadow: '0 14px 34px rgba(0,0,0,0.4)',
  },
  coachText: { fontSize: 12.5, lineHeight: 17, color: colors.grafite, fontWeight: '500' },
  coachStrong: { fontSize: 12.5, lineHeight: 17, color: colors.grafite, fontWeight: '700' },
  coachTail: {
    position: 'absolute',
    right: 26,
    bottom: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.cal,
  },

  camFab: {
    position: 'absolute',
    right: space.gutter,
    zIndex: 31,
    width: 66,
    height: 66,
    minWidth: HIT,
    minHeight: HIT,
    borderRadius: radius.md,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ferrugem,
    boxShadow: '0 12px 28px rgba(180,71,31,0.42)',
  },
  camBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: colors.cal,
    borderWidth: 1,
    borderColor: colors.calLine,
    borderRadius: radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  camBadgeText: { fontSize: 9, fontWeight: '700', color: colors.ferrugemClara },
});
