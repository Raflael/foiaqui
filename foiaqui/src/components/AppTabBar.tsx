import type { BottomTabBarProps } from 'expo-router/js-tabs';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { Body } from '@/components/Type';
import { useSheet } from '@/store/sheet';
import { colors, HIT, space, TABBAR_HEIGHT } from '@/theme';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Mapa', icon: 'map' },
  trilhas: { label: 'Trilhas', icon: 'trail' },
  salvos: { label: 'Salvos', icon: 'bookmark' },
  perfil: { label: 'Perfil', icon: 'user' },
};

/** Onde o FAB "Criar" entra no meio das abas. */
const FAB_AT = 2;

/**
 * Tab bar desenhada à mão em vez da nativa: o botão "Criar" é um FAB âmbar
 * que sobe acima da barra, e a barra é transparente pro mapa passar por baixo.
 *
 * "Criar" não é uma aba — abre `/adicionar` como modal sobre a aba atual,
 * que é o comportamento certo pra um fluxo com começo e fim.
 */
export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const closeSheet = useSheet((s) => s.close);

  const items = state.routes
    .map((route, index) => ({ route, index }))
    .filter(({ route }) => route.name in TABS);

  const openCreate = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // a ficha é uma folha por cima de tudo: fecha antes, senão fica pairando
    // sobre o fluxo de criação
    closeSheet();
    router.push('/adicionar');
  };

  const renderTab = ({ route, index }: (typeof items)[number]) => {
    const { label, icon } = TABS[route.name];
    const focused = state.index === index;

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        style={styles.tab}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}>
        <Icon
          name={icon}
          size={23}
          color={focused ? colors.ferrugem : colors.grafiteDim}
          strokeWidth={1.9}
        />
        <Body style={[styles.tabLabel, focused && { color: colors.ferrugem }]}>{label}</Body>
      </Pressable>
    );
  };

  return (
    <View
      style={[styles.bar, { height: TABBAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={['rgba(244,243,238,0)', colors.cal, colors.cal]}
        locations={[0, 0.38, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {items.slice(0, FAB_AT).map(renderTab)}

      <Pressable
        onPress={openCreate}
        style={styles.fabSlot}
        accessibilityRole="button"
        accessibilityLabel="Criar nova memória">
        <View style={styles.fab}>
          <LinearGradient
            colors={[colors.ferrugemClara, colors.ferrugem, colors.ferrugem]}
            locations={[0, 0.6, 1]}
            start={{ x: 0.35, y: 0.3 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Icon name="plus" size={28} color={colors.sobreFerrugem} strokeWidth={2.6} />
        </View>
        <Body style={[styles.tabLabel, { color: colors.ferrugem, marginTop: 2 }]}>Criar</Body>
      </Pressable>

      {items.slice(FAB_AT).map(renderTab)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingTop: space.md,
    paddingHorizontal: 14,
  },
  tab: {
    flex: 1,
    minHeight: HIT,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
  },
  tabLabel: { fontSize: 10.5, fontWeight: '600', letterSpacing: 0.2, color: colors.grafiteDim },
  fabSlot: { alignItems: 'center', top: -16, paddingHorizontal: space.sm },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(180,71,31,0.38)',
  },
});
