import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import { Plaque as PlaquePlate } from '@/components/Plaque';
import { Body, Mono, Plaque } from '@/components/Type';
import { distanceMeters, distanceTo, formatDistance } from '@/data/location';
import { mapStyle } from '@/data/mapStyle';
import { trails } from '@/data/trails';
import { useCurrentPosition } from '@/hooks/useCurrentPosition';
import { useMemorias } from '@/store/acervo';
import { useSheet } from '@/store/sheet';
import { alpha, colors, HIT, radius, space } from '@/theme';

/**
 * A trilha: um percurso costurando memórias numa caminhada.
 *
 * Última tela do sitemap a existir. Até aqui, tocar numa trilha abria a
 * primeira parada e fingia — o que escondia justamente o que a trilha
 * acrescenta: a ORDEM e o caminho entre os pontos.
 */
export default function TrilhaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { position } = useCurrentPosition();
  const memorias = useMemorias();
  const openSheet = useSheet((s) => s.open);

  const trail = trails.find((t) => t.id === id);
  if (!trail) {
    return (
      <View style={[styles.screen, styles.vazia, { paddingTop: insets.top + space.xxl }]}>
        <Plaque style={styles.vaziaTitulo}>Trilha não encontrada</Plaque>
        <Pressable style={styles.voltarBtn} onPress={() => router.back()}>
          <Body style={styles.voltarBtnText}>Voltar</Body>
        </Pressable>
      </View>
    );
  }

  const paradas = trail.stopIds
    .map((sid) => memorias.find((m) => m.id === sid))
    .filter((m) => m !== undefined);

  /**
   * O acervo ainda não tem todas as paradas do roteiro. Dizer isso é melhor
   * que inflar o número: é exatamente o "mapa vazio" que a PO listou como
   * maior medo, e esconder não faz ele sumir — faz a pessoa descobrir sozinha
   * na rua, andando até um ponto que não existe.
   */
  const faltando = Math.max(0, trail.stopCount - paradas.length);

  const rota = paradas.map((m) => ({ latitude: m.coords.lat, longitude: m.coords.lng }));
  const centro = rota.length
    ? {
        latitude: rota.reduce((s, p) => s + p.latitude, 0) / rota.length,
        longitude: rota.reduce((s, p) => s + p.longitude, 0) / rota.length,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : undefined;

  /** Quanto se caminha somando as pernas entre paradas. */
  const metrosTotais = paradas.reduce(
    (soma, m, i) => (i === 0 ? 0 : soma + distanceMeters(paradas[i - 1].coords, m.coords)),
    0,
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }}
        showsVerticalScrollIndicator={false}>
        {/* capa */}
        <View style={styles.capa}>
          {trail.cover.kind === 'sepia' ? (
            <PhotoPlaceholder variant="past" style={StyleSheet.absoluteFill} />
          ) : (
            <LinearGradient
              colors={trail.cover.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          <LinearGradient
            colors={[alpha.scrim, 'transparent', alpha.veu]}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />

          <Pressable
            style={[styles.voltar, { top: insets.top + space.md }]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar às trilhas">
            <Icon name="chevronLeft" size={20} color={colors.sobreEsmalte} strokeWidth={2.2} />
          </Pressable>

          <View style={styles.capaInfo}>
            <Mono style={styles.tema}>{trail.theme.toUpperCase()}</Mono>
            <Plaque style={styles.titulo}>{trail.title}</Plaque>
          </View>
        </View>

        {/* números do percurso */}
        <View style={styles.numeros}>
          <Numero icone="clock" valor={`${trail.durationMin} min`} rotulo="a pé" />
          <Numero icone="pinSolid" valor={`${paradas.length}`} rotulo={`de ${trail.stopCount} paradas`} />
          <Numero
            icone="trail"
            valor={metrosTotais > 0 ? formatDistance(metrosTotais) : '—'}
            rotulo="de caminhada"
          />
        </View>

        {faltando > 0 ? (
          <View style={styles.aviso}>
            <Icon name="shield" size={16} color={colors.ferrugem} strokeWidth={2} />
            <Body style={styles.avisoText}>
              {faltando === 1 ? 'Uma parada deste roteiro ainda não tem' : `${faltando} paradas deste roteiro ainda não têm`}{' '}
              memória no acervo. Conhece a história de alguma? Você pode ser quem conta.
            </Body>
          </View>
        ) : null}

        {/* o caminho */}
        {centro ? (
          <View style={styles.mapa}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={StyleSheet.absoluteFill}
              initialRegion={centro}
              customMapStyle={mapStyle}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              toolbarEnabled={false}>
              {rota.length > 1 ? (
                <Polyline
                  coordinates={rota}
                  strokeColor={colors.ferrugem}
                  strokeWidth={3}
                  lineDashPattern={[8, 6]}
                />
              ) : null}
              {paradas.map((m, i) => (
                <Marker
                  key={m.id}
                  coordinate={{ latitude: m.coords.lat, longitude: m.coords.lng }}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={false}
                  onPress={() => openSheet(m.id)}
                  accessibilityLabel={`Parada ${i + 1}: ${m.title}`}>
                  <PlaquePlate style={styles.numeroPin} frameStyle={styles.numeroPinFrame}>
                    <Plaque style={styles.numeroPinText}>{String(i + 1)}</Plaque>
                  </PlaquePlate>
                </Marker>
              ))}
            </MapView>
          </View>
        ) : null}

        {/* as paradas, na ordem */}
        <Plaque style={styles.secao}>As paradas</Plaque>
        {paradas.map((m, i) => (
          <Pressable
            key={m.id}
            style={({ pressed }) => [styles.parada, pressed && { backgroundColor: colors.cal2 }]}
            onPress={() => openSheet(m.id)}
            accessibilityRole="button"
            accessibilityLabel={`Parada ${i + 1} de ${paradas.length}: ${m.title}, ${m.place}`}>
            <View style={styles.trilho}>
              <PlaquePlate style={styles.ordem} frameStyle={styles.ordemFrame}>
                <Plaque style={styles.ordemText}>{String(i + 1)}</Plaque>
              </PlaquePlate>
              {i < paradas.length - 1 ? <View style={styles.linhaTrilho} /> : null}
            </View>

            <View style={styles.paradaTexto}>
              <Plaque style={styles.paradaTitulo}>{m.title}</Plaque>
              <Body style={styles.paradaLugar}>{m.place}</Body>
              <Mono style={styles.paradaMeta}>
                {m.year} · a {formatDistance(distanceTo(m, position))} de você
              </Mono>
            </View>

            <Icon name="chevronRight" size={18} color={colors.grafiteDim} />
          </Pressable>
        ))}

        {paradas.length > 0 ? (
          <Pressable
            style={styles.comecar}
            onPress={() => openSheet(paradas[0].id)}
            accessibilityRole="button"
            accessibilityLabel={`Começar a trilha pela parada ${paradas[0].title}`}>
            <Icon name="arrowLeft" size={18} color={colors.sobreFerrugem} strokeWidth={2.2} />
            <Body style={styles.comecarText}>Começar pela primeira parada</Body>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Numero({ icone, valor, rotulo }: { icone: 'clock' | 'pinSolid' | 'trail'; valor: string; rotulo: string }) {
  return (
    <View style={styles.numero}>
      <Icon name={icone} size={17} color={colors.esmalte} strokeWidth={2} />
      <Mono style={styles.numeroValor}>{valor}</Mono>
      <Body style={styles.numeroRotulo}>{rotulo}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cal },

  capa: { height: 240, justifyContent: 'flex-end' },
  voltar: {
    position: 'absolute',
    left: space.md,
    width: HIT,
    height: HIT,
    borderRadius: HIT / 2,
    backgroundColor: alpha.chrome,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  capaInfo: { paddingHorizontal: space.xl, paddingBottom: space.xl },
  tema: { fontSize: 10.5, letterSpacing: 2.4, color: colors.ferrugemSobreEscuro },
  titulo: { fontSize: 27, lineHeight: 29, color: colors.sobreEsmalte, marginTop: 6 },

  numeros: { flexDirection: 'row', paddingHorizontal: space.xl, paddingTop: space.xl, gap: space.sm },
  numero: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.cal2,
    borderWidth: 1,
    borderColor: colors.calLine,
  },
  numeroValor: { fontSize: 15, color: colors.esmalte, marginTop: 2 },
  numeroRotulo: { fontSize: 11, color: colors.grafiteDim, textAlign: 'center' },

  aviso: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
    marginHorizontal: space.xl,
    marginTop: space.lg,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: alpha.ferrugemTinta,
  },
  avisoText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: colors.grafite },

  mapa: {
    height: 180,
    marginHorizontal: space.xl,
    marginTop: space.lg,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.calLine,
  },
  numeroPin: { padding: 3 },
  numeroPinFrame: { borderWidth: 1.5, paddingHorizontal: 7, paddingVertical: 2 },
  numeroPinText: { fontSize: 13, color: colors.sobreEsmalte },

  secao: { fontSize: 17, color: colors.grafite, paddingHorizontal: space.xl, paddingTop: space.xxl },

  parada: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
  },
  trilho: { alignItems: 'center', paddingTop: 2 },
  ordem: { padding: 3 },
  ordemFrame: { borderWidth: 1.5, paddingHorizontal: 8, paddingVertical: 3 },
  ordemText: { fontSize: 13, color: colors.sobreEsmalte },
  // o fio que liga uma parada à seguinte: é a caminhada, desenhada
  linhaTrilho: { width: 2, flexGrow: 1, minHeight: 26, marginTop: 4, backgroundColor: colors.calLine },

  paradaTexto: { flex: 1, paddingBottom: space.sm },
  paradaTitulo: { fontSize: 16, color: colors.grafite },
  paradaLugar: { fontSize: 13, color: colors.grafiteDim, marginTop: 3 },
  paradaMeta: { fontSize: 11, color: colors.esmalte, marginTop: 4 },

  comecar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: HIT + 8,
    marginHorizontal: space.xl,
    marginTop: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.ferrugem,
  },
  comecarText: { fontSize: 15, fontWeight: '600', color: colors.sobreFerrugem },

  vazia: { alignItems: 'center', gap: space.lg, paddingHorizontal: space.xxl },
  vaziaTitulo: { fontSize: 22, color: colors.grafite },
  voltarBtn: {
    minHeight: HIT,
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    borderRadius: radius.md,
    backgroundColor: colors.ferrugem,
  },
  voltarBtnText: { fontSize: 15, fontWeight: '600', color: colors.sobreFerrugem },
});
