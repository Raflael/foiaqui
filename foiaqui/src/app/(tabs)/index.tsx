import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/Chip';
import { Glass } from '@/components/Glass';
import { Icon, type IconName } from '@/components/Icon';
import { MemoryRow } from '@/components/MemoryCard';
import { MemoryPin } from '@/components/MemoryPin';
import { SearchBar } from '@/components/SearchBar';
import { Body, Mono } from '@/components/Type';
import { YouAreHere } from '@/components/YouAreHere';
import { distanceTo, fallbackPosition, formatDistance } from '@/data/location';
import { useMarkerTracking } from '@/hooks/useMarkerTracking';
import { Timeline } from '@/components/Timeline';
import { agrupar, type Regiao } from '@/data/cluster';
import { decadasDo, naDecada, rotuloLongo } from '@/data/decadas';
import { pontoPor } from '@/data/pontos';
import { mapStyle } from '@/data/mapStyle';
import { mapFilters, matchesQuery } from '@/data/memories';
import { useCurrentPosition } from '@/hooks/useCurrentPosition';
import { useMotionEnabled } from '@/hooks/useMotion';
import { useSettings } from '@/store/settings';
import { useMemorias } from '@/store/acervo';
import { useSheet } from '@/store/sheet';
import { colors, HIT, radius, space, TABBAR_HEIGHT } from '@/theme';

/** Cada memória ganha o ícone do que ela foi. Com dados reais isso viria da categoria. */
const PIN_ICONS: Record<string, IconName> = {
  cine: 'film',
  praca: 'bandstand',
  mural: 'circlePlus',
};

/**
 * Acima deste raio o GPS não sabe direito onde você está, e o app precisa
 * dizer isso — Decisão 7: "prever estados de erro e GPS impreciso".
 */
const FUZZY_M = 40;

/** Altura ocupada pela busca + linha de chips, que flutuam sobre o conteúdo. */
const TOP_CHROME = 124;
/** altura da régua de décadas, para o resto do rodapé se empilhar acima dela */
const TIMELINE_H = 74;

/** Enquadramento inicial: cabe as três memórias com folga. */
const INITIAL_REGION = {
  latitude: fallbackPosition.lat,
  longitude: fallbackPosition.lng,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { height: H, width: W } = useWindowDimensions();
  const motion = useMotionEnabled();
  const mapRef = useRef<MapView>(null);
  const { position, accuracy, source, denied } = useCurrentPosition();

  // null = sem recorte, mostra tudo. Chip clicado de novo limpa o filtro:
  // na rua a pessoa precisa desfazer sem procurar um "x".
  const [filterId, setFilterId] = useState<string | null>(null);
  /** década escolhida na linha do tempo; null = todas as épocas (Decisão 11) */
  const [decada, setDecada] = useState<number | null>(null);
  /**
   * Mapa e lista mostram exatamente o mesmo recorte.
   * A Decisão 8 exige que a AR tenha sempre equivalente em mapa E lista —
   * e a lista é o que sobra quando o GPS erra ou a rede cai.
   */
  const [view, setView] = useState<'mapa' | 'lista'>('mapa');
  const [query, setQuery] = useState('');

  const coachDismissed = useSettings((s) => s.coachDismissed);
  const dismissCoach = useSettings((s) => s.dismissCoach);

  const openId = useSheet((s) => s.openId);
  const snap = useSheet((s) => s.snap);
  const openSheet = useSheet((s) => s.open);

  const floorGap = TABBAR_HEIGHT + insets.bottom + space.xl;

  const memories = useMemorias();
  const filter = mapFilters.find((f) => f.id === filterId) ?? null;
  // busca e chip se somam, não se substituem: "Anos 60" + "praça" é um recorte só
  const shown = memories
    .filter((m) => (filter ? filter.match(m, { from: position }) : true))
    .filter((m) => naDecada(m, decada))
    .filter((m) => matchesQuery(m, query));
  // a régua conta o acervo inteiro, não o recorte: as décadas vazias precisam
  // continuar visíveis depois de filtrar, senão o buraco some junto
  const decadas = decadasDo(memories);
  const byDistance = [...shown].sort(
    (a, b) => distanceTo(a, position) - distanceTo(b, position),
  );

  /**
   * O padding diz ao mapa qual faixa continua visível, então `animateCamera`
   * centraliza ali dentro em vez de atrás da ficha. É o que sustenta a
   * Decisão 2: abrir a memória sem perder de vista onde ela fica.
   */
  const sheetOccupies = openId && snap !== 'peek' ? H * 0.54 : TABBAR_HEIGHT + insets.bottom;

  // primeira leitura do GPS: leva o mapa até onde a pessoa está de verdade
  const centered = useRef(false);
  useEffect(() => {
    if (source !== 'gps' || centered.current || openId) return;
    centered.current = true;
    mapRef.current?.animateCamera(
      { center: { latitude: position.lat, longitude: position.lng } },
      { duration: motion ? 600 : 0 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, position.lat, position.lng]);

  useEffect(() => {
    const target = shown.find((m) => m.id === openId);
    if (!target || snap === 'peek') return;
    mapRef.current?.animateCamera(
      { center: { latitude: target.coords.lat, longitude: target.coords.lng } },
      { duration: motion ? 420 : 0 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, snap]);

  /**
   * No Android, marcador com view customizada vira bitmap, e ele para de ser
   * redesenhado quando `tracksViewChanges` fica false.
   *
   * O relógio precisa começar quando o MAPA fica pronto, não quando a tela
   * monta: o MapView leva segundos para inicializar, e desligar a captura
   * antes disso congela a chapa vazia, sem moldura nem texto — foi exatamente
   * o bug que apareceu no primeiro build.
   */
  /**
   * Memórias empilhadas viram um grupo só. Com placas largas, duas a poucos
   * metros uma da outra ficam ilegíveis — e é exatamente o que acontece quando
   * alguém registra várias memórias do mesmo quarteirão.
   */
  const [regiao, setRegiao] = useState<Regiao>(INITIAL_REGION);
  const grupos = agrupar(shown, regiao, W, H);

  const chaveDosPins = grupos.map((g) => g.itens.map((m) => m.id).join(',')).join('|');
  const { aoCarregarMapa, capturando } = useMarkerTracking(
    `${openId}|${filterId}|${decada}|${query}|${chaveDosPins}`,
  );

  return (
    <View style={styles.screen}>
      <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          initialRegion={INITIAL_REGION}
          customMapStyle={mapStyle}
          onMapReady={aoCarregarMapa}
          onRegionChangeComplete={setRegiao}
          mapPadding={{ top: insets.top + TOP_CHROME, left: 0, right: 0, bottom: sheetOccupies }}
          showsCompass={false}
          toolbarEnabled={false}
          showsMyLocationButton={false}
          rotateEnabled={false}
          pitchEnabled={false}>
          {/*
            Raio de incerteza: quando o GPS não sabe direito, o app mostra o
            quanto não sabe. Ponto cravado sobre erro de 80 metros é mentira.
          */}
          {accuracy && accuracy > FUZZY_M ? (
            <Circle
              center={{ latitude: position.lat, longitude: position.lng }}
              radius={accuracy}
              strokeColor="rgba(26,29,35,0.22)"
              fillColor="rgba(26,29,35,0.07)"
              strokeWidth={1}
            />
          ) : null}

          <Marker
            coordinate={{ latitude: position.lat, longitude: position.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            accessibilityLabel="Sua localização atual">
            <YouAreHere />
          </Marker>

          {grupos.map((g) => {
            const memory = g.itens[0];
            const ponto = pontoPor(g.pontoId);
            // um lugar com várias histórias abre direto na mais antiga: o pin
            // é o lugar, e a ficha por dentro é o feed dele
            const abreFicha = g.itens.length === 1 || !!ponto;
            return (
              <Marker
                key={abreFicha ? (ponto ? `ponto-${ponto.id}` : memory.id) : `grupo-${g.lat}-${g.lng}`}
                coordinate={{ latitude: g.lat, longitude: g.lng }}
                anchor={{ x: 0.5, y: 1 }}
                tracksViewChanges={capturando}
                onPress={() => {
                  if (abreFicha) {
                    openSheet(memory.id);
                    return;
                  }
                  // grupo de lugares diferentes: aproxima até se separarem
                  mapRef.current?.fitToCoordinates(
                    g.itens.map((m) => ({ latitude: m.coords.lat, longitude: m.coords.lng })),
                    {
                      edgePadding: { top: 200, right: 90, bottom: 260, left: 90 },
                      animated: motion,
                    },
                  );
                }}
                accessibilityLabel={
                  ponto && g.itens.length > 1
                    ? `${ponto.nome}, ${g.itens.length} memórias. Abrir o lugar.`
                    : abreFicha
                      ? `${memory.title}, ${memory.year}. Abrir memória.`
                      : `${g.itens.length} memórias juntas. Aproximar para separá-las.`
                }>
                {ponto && g.itens.length > 1 ? (
                  <MemoryPin
                    icon="list"
                    label={`${ponto.shortName} · ${g.itens.length}`}
                    active={g.itens.some((m) => m.id === openId)}
                  />
                ) : g.itens.length === 1 ? (
                  <MemoryPin
                    icon={PIN_ICONS[memory.id] ?? 'pin'}
                    label={`${memory.shortName} · ${memory.year}`}
                    active={memory.id === openId}
                    pending={memory.status === 'em_revisao'}
                  />
                ) : (
                  <MemoryPin
                    icon="list"
                    label={`${g.itens.length} memórias`}
                    active={g.itens.some((m) => m.id === openId)}
                  />
                )}
              </Marker>
            );
          })}
        </MapView>

      {/*
        A lista fica POR CIMA do mapa, nunca no lugar dele. Trocar de visão
        desmontava o MapView, e ao voltar a câmera ressuscitava no
        enquadramento inicial — foi por isso que o mapa "voltava para Santos".
      */}
      {view === 'lista' ? (
        <ScrollView
          style={[StyleSheet.absoluteFill, styles.listOver]}
          contentContainerStyle={{
            paddingTop: insets.top + TOP_CHROME,
            paddingBottom: TABBAR_HEIGHT + insets.bottom + space.xxl,
          }}
          showsVerticalScrollIndicator={false}>
          {byDistance.map((memory) => (
            <MemoryRow
              key={memory.id}
              memory={memory}
              distance={formatDistance(distanceTo(memory, position))}
              onPress={() => openSheet(memory.id)}
            />
          ))}
          {byDistance.length === 0 ? (
            <View style={styles.empty}>
              <Icon name="bookmark" size={30} color={colors.calLine} strokeWidth={1.6} />
              <Body style={styles.emptyText}>
                {query
                  ? `Nada encontrado para "${query}". Tente o nome do lugar, a década ou o tema.`
                  : `Nada ${filter?.countLabel} por aqui ainda. Que tal contar a primeira?`}
              </Body>
            </View>
          ) : null}
        </ScrollView>
      ) : null}

      <View style={[styles.top, { top: insets.top + space.md }]}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          action={{
            icon: view === 'mapa' ? 'list' : 'map',
            label: view === 'mapa' ? 'Ver em lista' : 'Ver no mapa',
            active: view === 'lista',
            onPress: () => setView((v) => (v === 'mapa' ? 'lista' : 'mapa')),
          }}
        />
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

      {/*
        A régua fica no rodapé, colada no polegar: o contexto é uma mão só na
        rua (Decisão 7). Some na lista, onde não há mapa para recortar.
      */}
      {view === 'mapa' ? (
        <View style={[styles.linhaDoTempo, { bottom: floorGap }]}>
          <Timeline decadas={decadas} selecionada={decada} onSelecionar={setDecada} />
        </View>
      ) : null}

      <Glass style={[styles.count, { bottom: floorGap + TIMELINE_H + space.sm }]}>
        {shown.length === 0 ? (
          <Body style={styles.countText}>
            {query ? (
              <>
                Nada encontrado para{' '}
                <Body style={styles.countStrong}>&ldquo;{query}&rdquo;</Body>.
              </>
            ) : (
              <>
                Nenhuma memória <Body style={styles.countStrong}>{filter?.countLabel}</Body> por
                aqui. Que tal contar a primeira?
              </>
            )}
          </Body>
        ) : (
          <Body style={styles.countText}>
            <Mono style={styles.countNumber}>{shown.length}</Mono>{' '}
            {shown.length === 1 ? 'memória' : 'memórias'}
            {query
              ? ' encontradas'
              : filter
                ? ` ${filter.countLabel}`
                : decada !== null
                  ? ` ${rotuloLongo(decada).toLowerCase()}`
                  : ' no acervo'}
          </Body>
        )}

        {/*
          Sem GPS o app não finge saber onde você está. Dizer isso é o que
          permite entender por que "perto de mim" trouxe o que trouxe.
        */}
        {denied ? (
          <Body style={styles.countNote}>
            Sem sua localização &mdash; mostrando o centro de São José dos Campos
          </Body>
        ) : null}
      </Glass>

      {!coachDismissed && view === 'mapa' ? (
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
        style={[styles.camFab, { bottom: floorGap + TIMELINE_H + space.sm }]}
        onPress={() => router.push('/ar')}
        accessibilityRole="button"
        accessibilityLabel="Abrir câmera em realidade aumentada">
        <LinearGradient
          colors={[colors.ferrugemClara, colors.ferrugem, colors.ferrugem]}
          locations={[0, 0.6, 1]}
          start={{ x: 0.35, y: 0.3 }}
          end={{ x: 1, y: 1 }}
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
  screen: { flex: 1, backgroundColor: colors.mapaFundo },
  listOver: { backgroundColor: colors.cal },

  top: { position: 'absolute', left: space.lg, right: space.lg, zIndex: 20, gap: space.md },
  chips: { gap: space.sm, paddingRight: space.lg },

  linhaDoTempo: { position: 'absolute', left: space.lg, right: space.lg, zIndex: 20 },

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
  countNote: { fontSize: 11, color: colors.ferrugem, marginTop: 3 },

  empty: { alignItems: 'center', gap: space.md, paddingHorizontal: space.xxl, paddingTop: 60 },
  emptyText: { fontSize: 14, lineHeight: 21, color: colors.grafiteDim, textAlign: 'center' },

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
  coachStrong: { fontSize: 12.5, lineHeight: 17, color: colors.grafite, fontWeight: '600' },
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
  camBadgeText: { fontSize: 9, fontWeight: '700', color: colors.ferrugem },
});
