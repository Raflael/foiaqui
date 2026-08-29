import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { MemoryRow } from '@/components/MemoryCard';
import { Body, Eyebrow, Plaque } from '@/components/Type';
import { memories } from '@/data/memories';
import { useSaved } from '@/store/saved';
import { useSheet } from '@/store/sheet';
import { colors, space, TABBAR_HEIGHT } from '@/theme';

export default function SalvosScreen() {
  const insets = useSafeAreaInsets();
  const savedIds = useSaved((s) => s.ids);
  const openSheet = useSheet((s) => s.open);

  // preserva a ordem em que a pessoa salvou, não a ordem do catálogo
  const saved = savedIds
    .map((id) => memories.find((m) => m.id === id))
    .filter((m) => m !== undefined);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + space.gutter,
        paddingBottom: TABBAR_HEIGHT + insets.bottom + space.xl,
      }}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Eyebrow>Sua coleção</Eyebrow>
        <Plaque style={styles.title}>Salvos</Plaque>
      </View>

      {saved.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="bookmark" size={34} color={colors.calLine} strokeWidth={1.8} />
          <Body style={styles.emptyText}>
            Nada salvo ainda. Toque no marcador de uma memória pra guardá-la aqui.
          </Body>
        </View>
      ) : (
        saved.map((memory) => (
          <MemoryRow key={memory.id} memory={memory} onPress={() => openSheet(memory.id)} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cal },
  header: { paddingHorizontal: space.gutter, paddingBottom: space.md, gap: space.sm },
  title: { fontSize: 20, letterSpacing: -0.5 },
  empty: {
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xxl,
    paddingTop: 60,
  },
  emptyText: { fontSize: 14, lineHeight: 21, color: colors.grafiteDim, textAlign: 'center' },
});
