import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Body, Eyebrow, Plaque } from '@/components/Type';
import { criterios } from '@/data/criterios';
import { useMemoria } from '@/store/acervo';
import { useDenuncia, useModeracao } from '@/store/moderacao';
import { alpha, colors, HIT, space } from '@/theme';

/**
 * Denunciar uma memória já publicada.
 *
 * A revisão pega o que entra; a denúncia pega o que passou. Sem ela a
 * moderação só olha para frente, e o que escapou de um parecer fica publicado
 * para sempre — exatamente a preocupação da PO com "qualidade e veracidade do
 * conteúdo".
 *
 * A régua é a mesma da revisão, de propósito. Denunciar por um critério que
 * ninguém usa para julgar seria pedir à pessoa que escrevesse uma reclamação
 * no vazio; apontando o mesmo critério, o relato chega a quem revisa já
 * dizendo o que olhar.
 *
 * O botão era inerte antes: desenhado na ficha, anunciado como botão para o
 * leitor de tela, e sem ação nenhuma. Numa tela que fala em moderação
 * comunitária, um "Reportar" que não reporta é a pior das mentiras de
 * interface.
 */
export default function ReportarScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const memoria = useMemoria(id);
  const denunciar = useModeracao((s) => s.denunciar);
  const jaDenunciada = useDenuncia(id);

  const [criterioId, setCriterioId] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [enviada, setEnviada] = useState(false);

  const enviar = () => {
    if (!id || !criterioId) return;
    denunciar({ memoriaId: id, criterioId, nota: nota.trim() || undefined, quando: Date.now() });
    setEnviada(true);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.topo, { paddingTop: insets.top + space.md }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.voltar}
          accessibilityRole="button"
          accessibilityLabel="Voltar">
          <Icon name="chevronLeft" size={20} color={colors.sobreEsmalte} strokeWidth={2.4} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Eyebrow style={styles.eyebrow}>Reportar</Eyebrow>
          <Plaque style={styles.titulo}>{memoria?.title ?? 'Memória'}</Plaque>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.gutter,
          paddingBottom: insets.bottom + space.xxl,
        }}
        showsVerticalScrollIndicator={false}>
        {enviada || jaDenunciada ? (
          <View style={styles.pronto}>
            <Icon name="shieldCheck" size={32} color={colors.conferido} strokeWidth={1.8} />
            <Plaque style={styles.prontoTitulo}>Recebido</Plaque>
            <Body style={styles.prontoTexto}>
              Esta memória volta para a fila da comunidade com o seu apontamento. Quem revisar vai
              ler o motivo antes de decidir — e quem publicou vai saber o que foi questionado.
            </Body>
            <Body style={styles.prontoNota}>
              Denunciar não apaga nada sozinho. Uma pessoa sozinha não derruba a memória de outra;
              é a revisão que decide.
            </Body>
            <Pressable
              style={styles.fechar}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Voltar ao mapa">
              <Body style={styles.fecharText}>Voltar</Body>
            </Pressable>
          </View>
        ) : (
          <>
            <Body style={styles.ajuda}>
              Qual critério da comunidade esta memória não cumpre? É a mesma régua usada na
              revisão — apontar o critério faz o seu relato chegar já dizendo o que olhar.
            </Body>

            {criterios.map((c) => {
              const escolhido = criterioId === c.id;
              return (
                <Pressable
                  key={c.id}
                  style={[styles.opcao, escolhido && styles.opcaoOn]}
                  onPress={() => setCriterioId(c.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: escolhido }}
                  accessibilityLabel={c.pergunta}>
                  <View style={[styles.marca, escolhido && styles.marcaOn]}>
                    {escolhido ? (
                      <Icon name="x" size={12} color={colors.sobreFerrugem} strokeWidth={3} />
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Body style={styles.opcaoPergunta}>{c.pergunta}</Body>
                    <Body style={styles.opcaoDetalhe}>{c.recusa}</Body>
                  </View>
                </Pressable>
              );
            })}

            <Body style={styles.notaRotulo}>Quer explicar? (opcional)</Body>
            <TextInput
              style={styles.notaCampo}
              value={nota}
              onChangeText={setNota}
              placeholder="O que você viu de errado"
              placeholderTextColor={colors.grafiteDim}
              multiline
              maxLength={240}
              accessibilityLabel="Explicação da denúncia"
            />

            <Pressable
              style={[styles.enviar, !criterioId && styles.enviarOff]}
              onPress={enviar}
              disabled={!criterioId}
              accessibilityRole="button"
              accessibilityState={{ disabled: !criterioId }}
              accessibilityLabel="Enviar o reporte para a comunidade">
              <Body style={styles.enviarText}>Enviar para a comunidade</Body>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cal },

  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.gutter,
    paddingBottom: space.md,
    backgroundColor: colors.esmalte,
  },
  voltar: {
    width: HIT,
    height: HIT,
    borderRadius: HIT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.esmalteFundo,
  },
  eyebrow: { color: colors.sobreEsmalteDim },
  titulo: { fontSize: 20, lineHeight: 22, color: colors.sobreEsmalte, marginTop: 2 },

  ajuda: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.grafiteDim,
    marginTop: space.lg,
    marginBottom: space.sm,
  },

  opcao: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
    padding: space.md,
    minHeight: HIT,
    marginTop: space.sm,
    borderWidth: 1,
    borderColor: colors.calLine,
    backgroundColor: colors.cal2,
  },
  opcaoOn: { borderColor: colors.ferrugem, borderWidth: 1.5 },
  marca: {
    width: 20,
    height: 20,
    marginTop: 1,
    borderWidth: 1.5,
    borderColor: colors.calLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcaOn: { backgroundColor: colors.ferrugem, borderColor: colors.ferrugem },
  opcaoPergunta: { fontSize: 13.5, fontWeight: '600', color: colors.grafite },
  opcaoDetalhe: { fontSize: 12.5, lineHeight: 17.5, color: colors.grafiteDim, marginTop: 2 },

  notaRotulo: { fontSize: 13, color: colors.grafite, marginTop: space.lg },
  notaCampo: {
    minHeight: 78,
    marginTop: 6,
    padding: space.md,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.calLine,
    backgroundColor: colors.cal2,
    color: colors.grafite,
    fontSize: 14.5,
  },
  enviar: {
    minHeight: HIT + 4,
    marginTop: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ferrugem,
  },
  enviarOff: { opacity: 0.4 },
  enviarText: { fontSize: 15, fontWeight: '600', color: colors.sobreFerrugem },

  pronto: { alignItems: 'center', gap: space.md, paddingTop: 56 },
  prontoTitulo: { fontSize: 21, color: colors.grafite },
  prontoTexto: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.grafiteDim,
    textAlign: 'center',
  },
  prontoNota: {
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.grafite,
    textAlign: 'center',
    padding: space.md,
    backgroundColor: alpha.ferrugemTinta,
  },
  fechar: {
    minHeight: HIT,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.esmalte,
    marginTop: space.sm,
  },
  fecharText: { fontSize: 14.5, fontWeight: '600', color: colors.esmalte },
});
