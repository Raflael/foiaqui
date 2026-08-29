import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import { Body, Eyebrow, Mono, Plaque } from '@/components/Type';
import { trails } from '@/data/trails';
import { useSheet } from '@/store/sheet';
import { colors, radius, space, TABBAR_HEIGHT } from '@/theme';
import type { Trail } from '@/types';

export default function TrilhasScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + space.gutter,
        paddingBottom: TABBAR_HEIGHT + insets.bottom + space.xl,
        paddingHorizontal: space.gutter,
      }}
      showsVerticalScrollIndicator={false}>
      <Eyebrow>Percursos</Eyebrow>
      <Plaque style={styles.title}>Trilhas da cidade</Plaque>
      <Body style={styles.subtitle}>
        Roteiros que costuram memórias em uma caminhada. Feitos pela comunidade, escolas e
        arquivos.
      </Body>

      {trails.map((trail) => (
        <TrailCard key={trail.id} trail={trail} />
      ))}
    </ScrollView>
  );
}

function TrailCard({ trail }: { trail: Trail }) {
  const openSheet = useSheet((s) => s.open);
  // sem tela de trilha ainda: abre a primeira parada, que é o conteúdo real por trás
  const firstStop = trail.stopIds[0];

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={() => firstStop && openSheet(firstStop)}
      accessibilityRole="button"
      accessibilityLabel={`Trilha ${trail.title}. ${trail.theme}. ${trail.durationMin} minutos, ${trail.stopCount} paradas.`}>
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

      {/* escurece a base pro texto ganhar contraste sobre qualquer capa */}
      <LinearGradient
        colors={['rgba(8,10,16,0.35)', 'rgba(8,10,16,0.15)', 'rgba(8,10,16,0.9)']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.go}>
        <Icon name="chevronRight" size={18} color={colors.sobreFerrugem} strokeWidth={2.4} />
      </View>

      <View style={styles.info}>
        <Mono style={styles.theme}>{trail.theme.toUpperCase()}</Mono>
        <Plaque style={styles.cardTitle}>{trail.title}</Plaque>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Icon name="clock" size={14} color="#D9D2C4" />
            <Body style={styles.metaText}>{trail.durationMin} min</Body>
          </View>
          <View style={styles.metaItem}>
            <Icon name="pinSolid" size={14} color="#D9D2C4" />
            <Body style={styles.metaText}>{trail.stopCount} paradas</Body>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cal },
  title: { fontSize: 26, letterSpacing: -0.4, marginTop: space.sm },
  subtitle: { fontSize: 13.5, lineHeight: 19, color: colors.grafiteDim, marginTop: 6 },

  card: {
    height: 170,
    marginTop: space.lg,
    borderRadius: radius.md,
    overflow: 'hidden',
    boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
  },
  go: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.ferrugem,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { position: 'absolute', left: space.lg, right: space.lg, bottom: 14 },
  theme: { fontSize: 10, letterSpacing: 2, color: colors.ferrugemClara },
  cardTitle: { fontSize: 21, lineHeight: 23, color: '#FFFFFF', marginTop: 5 },
  meta: { flexDirection: 'row', gap: 14, marginTop: 9 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 20 },
  metaText: { fontSize: 12, color: '#D9D2C4' },
});
