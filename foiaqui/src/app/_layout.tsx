// Importados por peso, e não do índice do pacote: o índice reexporta todas as
// variantes e o Metro empacota cada uma. Por subpasta, vão só estes seis arquivos.
import { ArchivoNarrow_600SemiBold } from '@expo-google-fonts/archivo-narrow/600SemiBold';
import { ArchivoNarrow_700Bold } from '@expo-google-fonts/archivo-narrow/700Bold';
import { Archivo_400Regular } from '@expo-google-fonts/archivo/400Regular';
import { Archivo_600SemiBold } from '@expo-google-fonts/archivo/600SemiBold';
import { DMMono_400Regular } from '@expo-google-fonts/dm-mono/400Regular';
import { Newsreader_400Regular } from '@expo-google-fonts/newsreader/400Regular';
import { Newsreader_600SemiBold } from '@expo-google-fonts/newsreader/600SemiBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Erro } from '@/components/Erro';
import { MemorySheet } from '@/components/MemorySheet';
import { colors } from '@/theme';

// Segura a splash até as fontes estarem carregadas — senão os títulos aparecem
// no fallback do sistema e "pulam" pra letra da placa, que é o que mais se nota.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ArchivoNarrow_600SemiBold,
    ArchivoNarrow_700Bold,
    Archivo_400Regular,
    Archivo_600SemiBold,
    Newsreader_400Regular,
    Newsreader_600SemiBold,
    DMMono_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Se a fonte falhar, seguimos com o fallback do sistema em vez de travar
  // o app numa tela vazia.
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.cal }}>
      <SafeAreaProvider>
        {/* app claro: a barra de status usa ícones escuros */}
        <StatusBar style="dark" />
        {/* a rede: erro de runtime vira chapa com saída, não tela branca */}
        <Erro>
        <View style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.cal },
            }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="trilha/[id]" />
            <Stack.Screen name="moderacao" />
            <Stack.Screen name="contribuicoes" />
            <Stack.Screen name="colecao/[id]" />
            <Stack.Screen name="placa/[id]" />
            <Stack.Screen name="reportar" options={{ presentation: 'modal' }} />
            <Stack.Screen name="entrar" options={{ presentation: 'modal' }} />
            <Stack.Screen name="adicionar" options={{ presentation: 'modal' }} />
            <Stack.Screen
              name="ar"
              options={{ presentation: 'fullScreenModal', animation: 'fade' }}
            />
          </Stack>

          {/*
            A ficha não é rota: é uma folha que sobe sobre o que estiver na tela.
            Fica aqui, fora do Stack, para abrir igual a partir do mapa, dos
            salvos ou das trilhas — sem empilhar navegação e sem esconder o mapa
            (Decisão 2 da pesquisa).
          */}
          <MemorySheet />
        </View>
        </Erro>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
