import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { MemoryRow } from '@/components/MemoryCard';
import { Body, Eyebrow, Mono, Plaque } from '@/components/Type';
import { useMemorias } from '@/store/acervo';
import { useColecoes } from '@/store/colecoes';
import { useSaved } from '@/store/saved';
import { useSheet } from '@/store/sheet';
import { colors, HIT, space } from '@/theme';

/**
 * Uma coleção por dentro (Decisão 10).
 *
 * A tela faz três coisas e nenhuma a mais: mostra o que está guardado, deixa
 * tirar, e deixa puxar do que você salvou mas ainda não organizou. Renomear
 * está aqui porque o nome é a coisa mais provável de mudar — a pessoa cria
 * "centro" e depois entende que era "o centro da minha infância".
 */
export default function ColecaoScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const memories = useMemorias();
  const savedIds = useSaved((s) => s.ids);
  const openSheet = useSheet((s) => s.open);

  const colecao = useColecoes((s) => s.colecoes.find((c) => c.id === id));
  const renomear = useColecoes((s) => s.renomear);
  const apagar = useColecoes((s) => s.apagar);
  const guardar = useColecoes((s) => s.guardar);
  const tirar = useColecoes((s) => s.tirar);

  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(colecao?.nome ?? '');
  const [adicionando, setAdicionando] = useState(false);

  const dentro = (colecao?.memoriaIds ?? [])
    .map((mid) => memories.find((m) => m.id === mid))
    .filter((m) => m !== undefined);

  const disponiveis = savedIds
    .map((sid) => memories.find((m) => m.id === sid))
    .filter((m) => m !== undefined)
    .filter((m) => !(colecao?.memoriaIds ?? []).includes(m.id));

  if (!colecao) {
    return (
      <View style={[styles.screen, styles.vazia, { paddingTop: insets.top + space.xxl }]}>
        <Plaque style={styles.vaziaTitulo}>Coleção não encontrada</Plaque>
        <Pressable style={styles.voltarBtn} onPress={() => router.back()}>
          <Body style={styles.voltarBtnText}>Voltar</Body>
        </Pressable>
      </View>
    );
  }

  const confirmarNome = () => {
    if (nome.trim().length >= 2) renomear(colecao.id, nome);
    setEditando(false);
  };

  const confirmarApagar = () =>
    Alert.alert(
      'Apagar esta coleção?',
      `"${colecao.nome}" some, mas as memórias continuam salvas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: () => {
            apagar(colecao.id);
            router.back();
          },
        },
      ],
    );

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
          <Eyebrow style={styles.eyebrow}>Coleção</Eyebrow>
          {editando ? (
            <TextInput
              style={styles.campoNome}
              value={nome}
              onChangeText={setNome}
              onBlur={confirmarNome}
              onSubmitEditing={confirmarNome}
              maxLength={40}
              autoFocus
              accessibilityLabel="Nome da coleção"
            />
          ) : (
            <Pressable
              onPress={() => {
                setNome(colecao.nome);
                setEditando(true);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${colecao.nome}. Tocar para renomear.`}>
              <Plaque style={styles.titulo}>{colecao.nome}</Plaque>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.gutter,
          paddingBottom: insets.bottom + space.xxl,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Mono style={styles.conta}>
          {dentro.length === 0
            ? 'vazia'
            : `${dentro.length} ${dentro.length === 1 ? 'memória' : 'memórias'}`}
        </Mono>

        {dentro.length === 0 ? (
          <Body style={styles.dica}>
            Puxe aqui as memórias que você salvou. Uma coleção é sua leitura do acervo — o que
            junta essas histórias é um motivo que só você sabe.
          </Body>
        ) : null}

        {dentro.map((m) => (
          <View key={m.id} style={styles.item}>
            <View style={{ flex: 1 }}>
              <MemoryRow memory={m} onPress={() => openSheet(m.id)} />
            </View>
            <Pressable
              style={styles.tirar}
              onPress={() => tirar(colecao.id, m.id)}
              accessibilityRole="button"
              accessibilityLabel={`Tirar ${m.title} desta coleção`}>
              <Icon name="x" size={16} color={colors.ferrugem} strokeWidth={2.4} />
            </Pressable>
          </View>
        ))}

        {/* ── puxar do que está salvo ───────────────────────────── */}
        {disponiveis.length > 0 ? (
          <View style={styles.adicionarBloco}>
            {!adicionando ? (
              <Pressable
                style={styles.adicionarBtn}
                onPress={() => setAdicionando(true)}
                accessibilityRole="button"
                accessibilityLabel="Adicionar memórias salvas a esta coleção">
                <Icon name="plus" size={17} color={colors.esmalte} strokeWidth={2.6} />
                <Body style={styles.adicionarText}>
                  Adicionar dos seus salvos ({disponiveis.length})
                </Body>
              </Pressable>
            ) : (
              <>
                <Eyebrow style={styles.secaoTitulo}>Salvos fora desta coleção</Eyebrow>
                {disponiveis.map((m) => (
                  <Pressable
                    key={m.id}
                    style={styles.candidato}
                    onPress={() => guardar(colecao.id, m.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Guardar ${m.title} em ${colecao.nome}`}>
                    <Icon name="plus" size={16} color={colors.esmalte} strokeWidth={2.6} />
                    <View style={{ flex: 1 }}>
                      <Plaque style={styles.candidatoTitulo}>{m.title}</Plaque>
                      <Body style={styles.candidatoLugar}>{m.place}</Body>
                    </View>
                    <Mono style={styles.candidatoAno}>{m.year}</Mono>
                  </Pressable>
                ))}
                <Pressable
                  style={styles.fechar}
                  onPress={() => setAdicionando(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar a lista">
                  <Body style={styles.fecharText}>Pronto</Body>
                </Pressable>
              </>
            )}
          </View>
        ) : null}

        {/*
          Compartilhar o percurso como texto, não como link.
          Sem backend não existe URL que abra a coleção de outra pessoa — e um
          link que não abre nada seria a mentira de interface que este projeto
          apaga há dias. O roteiro em texto funciona hoje, em qualquer
          aplicativo, e cada parada leva o deep link que ABRE de verdade em
          quem tem o app.
        */}
        {dentro.length > 0 ? (
          <Pressable
            style={styles.compartilhar}
            onPress={() =>
              Share.share({
                title: colecao.nome,
                message: [
                  colecao.nome.toUpperCase() + " — um roteiro no FoiAqui",
                  "",
                  ...dentro.map(
                    (m, i) =>
                      (i + 1) + ". " + m.title + " (" + m.year + ")" + "\n   " +
                      m.place + "\n   foiaqui://m/" + m.id,
                  ),
                  "",
                  dentro.length + " paradas · memória urbana de São José dos Campos",
                ].join("\n"),
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`Compartilhar o roteiro ${colecao.nome} com as ${dentro.length} paradas`}>
            <Icon name="share" size={17} color={colors.sobreEsmalte} strokeWidth={2.2} />
            <Body style={styles.compartilharText}>Compartilhar este roteiro</Body>
          </Pressable>
        ) : null}

        <Pressable
          style={styles.apagar}
          onPress={confirmarApagar}
          accessibilityRole="button"
          accessibilityLabel="Apagar esta coleção">
          <Body style={styles.apagarText}>Apagar coleção</Body>
        </Pressable>
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
  titulo: { fontSize: 21, lineHeight: 23, color: colors.sobreEsmalte, marginTop: 2 },
  campoNome: {
    fontSize: 19,
    color: colors.sobreEsmalte,
    borderBottomWidth: 2,
    borderBottomColor: colors.sobreEsmalteDim,
    paddingVertical: 2,
    marginTop: 2,
  },

  conta: { fontSize: 12.5, color: colors.grafiteDim, marginTop: space.lg },
  dica: { fontSize: 14, lineHeight: 21, color: colors.grafiteDim, marginTop: space.md },

  item: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  tirar: {
    width: HIT,
    height: HIT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.calLine,
  },

  adicionarBloco: { marginTop: space.xl },
  adicionarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: HIT + 4,
    borderWidth: 1.5,
    borderColor: colors.esmalte,
  },
  adicionarText: { fontSize: 14.5, fontWeight: '600', color: colors.esmalte },
  secaoTitulo: { color: colors.grafiteDim, marginBottom: space.sm },
  candidato: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: HIT + 10,
    paddingHorizontal: space.md,
    marginTop: 1,
    backgroundColor: colors.cal2,
  },
  candidatoTitulo: { fontSize: 14.5, lineHeight: 16, color: colors.grafite },
  candidatoLugar: { fontSize: 11.5, color: colors.grafiteDim, marginTop: 2 },
  candidatoAno: { fontSize: 12.5, color: colors.esmalte },
  fechar: {
    minHeight: HIT,
    marginTop: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.esmalte,
  },
  fecharText: { fontSize: 14.5, fontWeight: '600', color: colors.sobreEsmalte },

  compartilhar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: HIT + 4,
    marginTop: space.xl,
    backgroundColor: colors.esmalte,
  },
  compartilharText: { fontSize: 14.5, fontWeight: '600', color: colors.sobreEsmalte },

  apagar: { minHeight: HIT, marginTop: space.xxl, alignItems: 'center', justifyContent: 'center' },
  apagarText: { fontSize: 13.5, color: colors.ferrugem, fontWeight: '600' },

  vazia: { alignItems: 'center', gap: space.md, paddingHorizontal: space.xxl },
  vaziaTitulo: { fontSize: 20, color: colors.grafite },
  voltarBtn: {
    minHeight: HIT,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.esmalte,
  },
  voltarBtnText: { fontSize: 14.5, fontWeight: '600', color: colors.esmalte },
});
