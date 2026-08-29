import { Tabs } from 'expo-router/js-tabs';

import { AppTabBar } from '@/components/AppTabBar';
import { colors } from '@/theme';

/**
 * `expo-router/js-tabs` e não o `Tabs` de `expo-router` (deprecado no SDK 57),
 * nem `NativeTabs`: a tab bar do FoiAqui é transparente, com um FAB âmbar
 * saindo pra fora da barra — a nativa não faz isso.
 */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.cal },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Mapa' }} />
      <Tabs.Screen name="trilhas" options={{ title: 'Trilhas' }} />
      <Tabs.Screen name="salvos" options={{ title: 'Salvos' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
