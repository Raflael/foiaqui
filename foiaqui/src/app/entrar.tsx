import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Body, Eyebrow, Mono, Plaque } from '@/components/Type';
import { usePerfil } from '@/store/perfil';
import { colors, FRAME, HIT, space } from '@/theme';

/**
 * A identificação — e ela NÃO é a porta do app.
 *
 * A Decisão 1 da pesquisa é explícita: abrir direto no mapa, sem splash nem
 * onboarding obrigatório, porque é o que os dois produtos de maior escala do
 * benchmarking fazem. Pedir cadastro antes de mostrar qualquer memória seria
 * cobrar antes de entregar. Esta tela só aparece quando a autoria passa a
 * importar: na hora de publicar, ou quando a pessoa vem ao perfil.
 *
 * O desenho: identificar-se aqui é ASSINAR UMA PLACA, então a chapa é a tela.
 * Ela sangra de borda a borda e sobe por baixo da barra de status — não é um
 * cartão flutuando sobre o fundo, é a placa que a pessoa está gravando. A
 * assinatura aparece nela ao vivo, letra por letra. Vazia, mostra o lugar da
 * assinatura esperando, que é exatamente o que uma placa em branco é.
 *
 * Assim o contrato do produto — toda memória leva o nome de quem contou —
 * chega pela forma antes de chegar por qualquer frase explicando.
 *
 * Não há aviso de "isto não é uma conta" porque a tela não afirma que é: não
 * pede senha, não desenha botão de Google que não abre nada, não fala em
 * cadastro. Ela pede uma assinatura, e é uma assinatura que ela guarda.
 */
export default function EntrarScreen() {
  const insets = useSafeAreaInsets();
  const { motivo } = useLocalSearchParams<{ motivo?: string }>();
  const entrar = usePerfil((s) => s.entrar);
  const cidadeAtual = usePerfil((s) => s.cidade);
  const nomeAtual = usePerfil((s) => s.nome);

  const [nome, setNome] = useState(nomeAtual ?? '');
  const [cidade, setCidade] = useState(cidadeAtual);
  const [focado, setFocado] = useState<'nome' | 'cidade' | null>(null);

  const assinatura = nome.trim();
  const cidadeMostrada = cidade.trim() || 'São José dos Campos';
  const valido = assinatura.length >= 2;
  const primeiroNome = assinatura.split(' ')[0];

  const confirmar = () => {
    if (!valido) return;
    entrar(nome, cidadeMostrada, 'local');
    router.back();
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* a chapa: sangra de borda a borda e sobe sob a barra de status */}
        <View style={[styles.chapa, { paddingTop: insets.top + space.xl }]}>
          <View style={styles.moldura}>
            <Eyebrow style={styles.marcador}>Contado por</Eyebrow>

            {assinatura ? (
              <Plaque style={styles.nome}>{assinatura}</Plaque>
            ) : (
              <View style={styles.esperando}>
                <View style={styles.linha} />
                <Mono style={styles.esperandoTexto}>seu nome aqui</Mono>
              </View>
            )}

            <View style={styles.regua} />
            <Plaque weight="semibold" style={styles.cidade}>
              {cidadeMostrada}
            </Plaque>
          </View>

          {/* a lasca: a marca do tempo que toda placa velha tem */}
          <View style={styles.lasca} />
        </View>

        <View style={styles.corpo}>
          <Body style={styles.intro}>
            {motivo === 'criar'
              ? 'Toda memória leva o nome de quem contou. É o que permite alguém dizer "essa história é da minha avó".'
              : 'Explorar o mapa não exige nada. Assinar o que você cria, sim.'}
          </Body>

          <Body style={styles.rotulo}>Como você quer assinar</Body>
          <TextInput
            style={[styles.campo, focado === 'nome' && styles.campoOn]}
            value={nome}
            onChangeText={setNome}
            onFocus={() => setFocado('nome')}
            onBlur={() => setFocado(null)}
            placeholder="Seu nome, ou como preferir ser chamado"
            placeholderTextColor={colors.grafiteDim}
            maxLength={40}
            autoCapitalize="words"
            accessibilityLabel="Nome com que você quer assinar suas memórias"
          />

          <Body style={styles.rotulo}>Sua cidade</Body>
          <TextInput
            style={[styles.campo, focado === 'cidade' && styles.campoOn]}
            value={cidade}
            onChangeText={setCidade}
            onFocus={() => setFocado('cidade')}
            onBlur={() => setFocado(null)}
            placeholder="São José dos Campos"
            placeholderTextColor={colors.grafiteDim}
            maxLength={40}
            accessibilityLabel="Cidade onde você mora"
          />

          <Pressable
            style={[styles.principal, !valido && styles.principalOff]}
            onPress={confirmar}
            disabled={!valido}
            accessibilityRole="button"
            accessibilityState={{ disabled: !valido }}
            accessibilityLabel={
              valido ? `Assinar como ${assinatura}` : 'Escreva um nome para continuar'
            }>
            <Body style={[styles.principalText, !valido && styles.principalTextOff]}>
              {valido ? `Assinar como ${primeiroNome}` : 'Escreva um nome'}
            </Body>
          </Pressable>

          <Pressable
            style={styles.pular}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Continuar explorando sem se identificar">
            <Body style={styles.pularText}>Só explorar por enquanto</Body>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cal },

  chapa: {
    backgroundColor: colors.esmalte,
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
  },
  // a moldura branca embutida, a assinatura do sistema — desenhada aqui em vez
  // de vir do componente Plaque porque esta chapa sangra na tela e precisa do
  // respiro interno maior que o padrão
  moldura: {
    borderWidth: FRAME,
    borderColor: colors.sobreEsmalte,
    paddingHorizontal: space.lg,
    paddingVertical: space.xl,
  },
  marcador: { color: colors.sobreEsmalteDim },
  nome: { fontSize: 34, lineHeight: 37, color: colors.sobreEsmalte, marginTop: 10 },

  // placa em branco: o lugar da assinatura, esperando
  esperando: { marginTop: 14, gap: 9 },
  // sobreEsmalteDim e não esmalteClaro: esta linha INFORMA onde vai o nome, e
  // esmalteClaro sobre esmalte dá 1,80:1 — some. Divisor decorativo pode ser
  // sutil; indicador de campo vazio, não.
  linha: { height: 2, width: '72%', backgroundColor: colors.sobreEsmalteDim },
  esperandoTexto: { fontSize: 13, color: colors.sobreEsmalteDim },

  regua: { height: 1, backgroundColor: colors.esmalteClaro, marginTop: space.xl },
  cidade: { fontSize: 12.5, color: colors.sobreEsmalteDim, marginTop: space.md },

  lasca: {
    position: 'absolute',
    right: 0,
    bottom: 52,
    width: 9,
    height: 64,
    backgroundColor: colors.ferrugem,
  },

  corpo: { paddingHorizontal: space.gutter, paddingTop: space.xl },
  intro: { fontSize: 14.5, lineHeight: 21, color: colors.grafite },

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
  campoOn: { borderColor: colors.esmalte, borderWidth: 2, backgroundColor: colors.cal },

  principal: {
    minHeight: HIT + 8,
    marginTop: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ferrugem,
  },
  // desabilitado é "ainda não", não "quebrado": ferrugem desbotada parecia
  // defeito, então o estado vazio usa a superfície neutra do app
  principalOff: { backgroundColor: colors.cal3 },
  principalText: { fontSize: 16, fontWeight: '600', color: colors.sobreFerrugem },
  principalTextOff: { color: colors.grafiteDim },

  pular: { minHeight: HIT, marginTop: 4, alignItems: 'center', justifyContent: 'center' },
  pularText: { fontSize: 14, color: colors.esmalte, fontWeight: '600' },
});
