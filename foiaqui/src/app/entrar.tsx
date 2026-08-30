import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Plaque as PlaquePlate } from '@/components/Plaque';
import { Body, Eyebrow, Plaque } from '@/components/Type';
import { usePerfil } from '@/store/perfil';
import { colors, HIT, space } from '@/theme';

/**
 * A identificação — e ela NÃO é a porta do app.
 *
 * A Decisão 1 da pesquisa é explícita: abrir direto no mapa, sem splash nem
 * onboarding obrigatório, porque é o que os dois produtos de maior escala do
 * benchmarking fazem. Pedir cadastro antes de mostrar qualquer memória seria
 * cobrar antes de entregar.
 *
 * Então esta tela só aparece quando a autoria passa a importar: na hora de
 * contribuir, ou quando a pessoa vai ao perfil por vontade própria. É o mesmo
 * contrato do Google Maps — explorar é livre, publicar tem nome.
 *
 * E ela não finge autenticar. Não há backend: não existe conta, senha, nem
 * como provar que você é você. Desenhar um cadeado aqui seria o tipo de
 * mentira de interface que este projeto vem apagando há dias. O que existe é
 * um nome que fica neste aparelho e assina o que você criar — e a tela diz
 * isso, incluindo o que ainda não funciona.
 */
export default function EntrarScreen() {
  const insets = useSafeAreaInsets();
  const { motivo } = useLocalSearchParams<{ motivo?: string }>();
  const entrar = usePerfil((s) => s.entrar);
  const cidadeAtual = usePerfil((s) => s.cidade);
  const nomeAtual = usePerfil((s) => s.nome);

  const [nome, setNome] = useState(nomeAtual ?? '');
  const [cidade, setCidade] = useState(cidadeAtual);

  const valido = nome.trim().length >= 2;

  const confirmar = () => {
    if (!valido) return;
    entrar(nome, cidade || 'São José dos Campos', 'local');
    router.back();
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + space.xl,
          paddingHorizontal: space.gutter,
          paddingBottom: insets.bottom + space.xxl,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.marca}>
          <PlaquePlate style={styles.chapa}>
            <Eyebrow style={styles.chapaEyebrow}>Foi aqui</Eyebrow>
            <Plaque style={styles.chapaTitulo}>Quem está contando?</Plaque>
          </PlaquePlate>
        </View>

        <Body style={styles.texto}>
          {motivo === 'criar'
            ? 'Toda memória leva o nome de quem contou — é o que permite alguém dizer "essa história é da minha avó". Antes de publicar, diga como quer assinar.'
            : 'Toda memória leva o nome de quem contou. Explorar o mapa não exige nada; assinar o que você criar, sim.'}
        </Body>

        <Body style={styles.rotulo}>Como você quer assinar</Body>
        <TextInput
          style={styles.campo}
          value={nome}
          onChangeText={setNome}
          placeholder="Seu nome, ou como preferir ser chamado"
          placeholderTextColor={colors.grafiteDim}
          maxLength={60}
          autoCapitalize="words"
          accessibilityLabel="Nome com que você quer assinar suas memórias"
        />

        <Body style={styles.rotulo}>Sua cidade</Body>
        <TextInput
          style={styles.campo}
          value={cidade}
          onChangeText={setCidade}
          placeholder="São José dos Campos"
          placeholderTextColor={colors.grafiteDim}
          maxLength={60}
          accessibilityLabel="Cidade onde você mora"
        />

        <Pressable
          style={[styles.principal, !valido && styles.principalOff]}
          onPress={confirmar}
          disabled={!valido}
          accessibilityRole="button"
          accessibilityState={{ disabled: !valido }}
          accessibilityLabel="Confirmar e continuar">
          <Body style={styles.principalText}>Continuar</Body>
        </Pressable>

        <Pressable
          style={styles.pular}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Continuar explorando sem se identificar">
          <Body style={styles.pularText}>Só explorar por enquanto</Body>
        </Pressable>

        {/*
          O que NÃO existe fica escrito, não desenhado. Um botão "Entrar com
          Google" que abre nada seria a mesma mentira que o "Reportar" inerte
          que a gente acabou de matar.
        */}
        <View style={styles.aviso}>
          <Icon name="shield" size={15} color={colors.esmalte} strokeWidth={2.2} />
          <View style={{ flex: 1 }}>
            <Body style={styles.avisoTitulo}>Isto não é uma conta</Body>
            <Body style={styles.avisoTexto}>
              Não há login de verdade neste protótipo: sem servidor, não existe conta, senha, nem
              como provar que você é você. Seu nome fica só neste aparelho e some se o app for
              desinstalado. Entrada com Google ou Apple, recuperação de conta e perfil público são
              parte do produto, não deste protótipo.
            </Body>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cal },

  marca: { marginBottom: space.xl },
  chapa: { paddingVertical: space.xl },
  chapaEyebrow: { color: colors.sobreEsmalteDim },
  chapaTitulo: { fontSize: 25, lineHeight: 27, color: colors.sobreEsmalte, marginTop: 6 },

  texto: { fontSize: 14.5, lineHeight: 22, color: colors.grafite },

  rotulo: { fontSize: 13, fontWeight: '600', color: colors.grafite, marginTop: space.lg },
  campo: {
    minHeight: HIT + 4,
    marginTop: 6,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderColor: colors.calLine,
    backgroundColor: colors.cal2,
    color: colors.grafite,
    fontSize: 15.5,
  },

  principal: {
    minHeight: HIT + 6,
    marginTop: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ferrugem,
  },
  principalOff: { opacity: 0.4 },
  principalText: { fontSize: 15.5, fontWeight: '600', color: colors.sobreFerrugem },

  pular: {
    minHeight: HIT,
    marginTop: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pularText: { fontSize: 14, color: colors.esmalte, fontWeight: '600' },

  aviso: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
    marginTop: space.xxl,
    padding: space.lg,
    backgroundColor: colors.cal2,
    borderLeftWidth: 3,
    borderLeftColor: colors.esmalte,
  },
  avisoTitulo: { fontSize: 13, fontWeight: '600', color: colors.grafite },
  avisoTexto: { fontSize: 12.5, lineHeight: 18, color: colors.grafiteDim, marginTop: 3 },
});
