import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { MemoryRow } from '@/components/MemoryCard';
import { Body, Eyebrow, Mono, Plaque } from '@/components/Type';
import { useMemorias } from '@/store/acervo';
import { useColecoes } from '@/store/colecoes';
import { useSaved } from '@/store/saved';
import { useSheet } from '@/store/sheet';
import { colors, HIT, space, TABBAR_HEIGHT } from '@/theme';

/**
 * Salvos e coleções — a Decisão 10.
 *
 * A hierarquia da pesquisa é pino → coleção → roteiro, e a coleção era o
 * degrau pulado: sem ela, "Salvos" é uma pilha de memórias soltas que não
 * serve para nada depois da décima.
 *
 * Salvar continua sendo um toque no marcador e não pergunta nada. Organizar é
 * um segundo momento, opcional — obrigar a escolher pasta na hora de salvar
 * mataria o gesto rápido, que é justamente o que faz alguém salvar.
 *
 * O que está salvo e fora de qualquer coleção aparece como "não organizados",
 * em vez de sumir num limbo. Coleção aqui é marcador, não pasta: a mesma
 * memória pode estar em várias.
 */
export default function SalvosScreen() {
  const insets = useSafeAreaInsets();
  const memories = useMemorias();
  const savedIds = useSaved((s) => s.ids);
  const openSheet = useSheet((s) => s.open);
  const colecoes = useColecoes((s) => s.colecoes);
  const criar = useColecoes((s) => s.criar);

  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState('');

  // preserva a ordem em que a pessoa salvou, não a ordem do catálogo
  const salvas = savedIds
    .map((id) => memories.find((m) => m.id === id))
    .filter((m) => m !== undefined);

  const organizadas = new Set(colecoes.flatMap((c) => c.memoriaIds));
  const soltas = salvas.filter((m) => !organizadas.has(m.id));

  const confirmar = () => {
    const limpo = nome.trim();
    if (limpo.length < 2) return;
    criar(limpo);
    setNome('');
    setCriando(false);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + space.gutter,
        paddingBottom: TABBAR_HEIGHT + insets.bottom + space.xl,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Eyebrow>Seu acervo</Eyebrow>
        <Plaque style={styles.title}>Salvos e coleções</Plaque>
      </View>

      {salvas.length === 0 && colecoes.length === 0 ? (
        <View style={styles.vazio}>
          <Icon name="bookmark" size={34} color={colors.calLine} strokeWidth={1.8} />
          <Body style={styles.vazioText}>
            Nada salvo ainda. Toque no marcador de uma memória para guardá-la aqui — depois dá
            para juntar as guardadas em coleções.
          </Body>
        </View>
      ) : null}

      {/* ── coleções ─────────────────────────────────────────────── */}
      <View style={styles.secao}>
        <View style={styles.secaoTopo}>
          <Eyebrow style={styles.secaoTitulo}>Coleções</Eyebrow>
          {!criando ? (
            <Pressable
              style={styles.nova}
              onPress={() => setCriando(true)}
              accessibilityRole="button"
              accessibilityLabel="Criar uma coleção">
              <Icon name="plus" size={15} color={colors.ferrugem} strokeWidth={2.6} />
              <Body style={styles.novaText}>Nova</Body>
            </Pressable>
          ) : null}
        </View>

        {criando ? (
          <View style={styles.formulario}>
            <TextInput
              style={styles.campo}
              value={nome}
              onChangeText={setNome}
              placeholder="O centro da minha infância"
              placeholderTextColor={colors.grafiteDim}
              maxLength={40}
              autoFocus
              onSubmitEditing={confirmar}
              accessibilityLabel="Nome da coleção"
            />
            <View style={styles.formAcoes}>
              <Pressable
                style={styles.cancelar}
                onPress={() => {
                  setCriando(false);
                  setNome('');
                }}
                accessibilityRole="button"
                accessibilityLabel="Cancelar">
                <Body style={styles.cancelarText}>Cancelar</Body>
              </Pressable>
              <Pressable
                style={[styles.confirmar, nome.trim().length < 2 && styles.confirmarOff]}
                onPress={confirmar}
                disabled={nome.trim().length < 2}
                accessibilityRole="button"
                accessibilityState={{ disabled: nome.trim().length < 2 }}
                accessibilityLabel="Criar a coleção">
                <Body style={styles.confirmarText}>Criar</Body>
              </Pressable>
            </View>
          </View>
        ) : null}

        {colecoes.length === 0 && !criando ? (
          <Body style={styles.dica}>
            Uma coleção junta memórias com um motivo seu: um bairro, uma década, um trabalho de
            escola, alguém para quem você quer mostrar.
          </Body>
        ) : null}

        {colecoes.map((c) => (
          <Pressable
            key={c.id}
            style={({ pressed }) => [styles.colecao, pressed && { opacity: 0.85 }]}
            onPress={() => router.push({ pathname: '/colecao/[id]', params: { id: c.id } })}
            accessibilityRole="button"
            accessibilityLabel={`Coleção ${c.nome}, ${c.memoriaIds.length} ${c.memoriaIds.length === 1 ? 'memória' : 'memórias'}`}>
            <View style={styles.colecaoLombada} />
            <View style={{ flex: 1 }}>
              <Plaque style={styles.colecaoNome}>{c.nome}</Plaque>
              <Mono style={styles.colecaoConta}>
                {c.memoriaIds.length === 0
                  ? 'vazia'
                  : `${c.memoriaIds.length} ${c.memoriaIds.length === 1 ? 'memória' : 'memórias'}`}
              </Mono>
            </View>
            <Icon name="chevronRight" size={18} color={colors.grafiteDim} />
          </Pressable>
        ))}
      </View>

      {/* ── salvas fora de coleção ───────────────────────────────── */}
      {soltas.length > 0 ? (
        <View style={styles.secao}>
          <Eyebrow style={styles.secaoTitulo}>
            {organizadas.size > 0 ? 'Não organizados' : 'Salvos'}
          </Eyebrow>
          {soltas.map((memory) => (
            <MemoryRow key={memory.id} memory={memory} onPress={() => openSheet(memory.id)} />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cal },
  header: { paddingHorizontal: space.gutter, paddingBottom: space.md, gap: space.sm },
  title: { fontSize: 20, letterSpacing: -0.5 },

  vazio: { alignItems: 'center', gap: space.md, paddingHorizontal: space.xxl, paddingTop: 48 },
  vazioText: { fontSize: 14, lineHeight: 21, color: colors.grafiteDim, textAlign: 'center' },

  secao: { marginTop: space.xl, paddingHorizontal: space.gutter },
  secaoTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  secaoTitulo: { color: colors.grafiteDim },
  nova: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: HIT,
    paddingHorizontal: space.sm,
  },
  novaText: { fontSize: 13.5, fontWeight: '600', color: colors.ferrugem },

  dica: { fontSize: 13, lineHeight: 19, color: colors.grafiteDim, marginTop: space.sm },

  formulario: { marginTop: space.sm, gap: space.sm },
  campo: {
    minHeight: HIT,
    paddingHorizontal: space.md,
    borderWidth: 2,
    borderColor: colors.esmalte,
    backgroundColor: colors.cal,
    color: colors.grafite,
    fontSize: 15.5,
  },
  formAcoes: { flexDirection: 'row', gap: space.sm },
  cancelar: {
    minHeight: HIT,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.calLine,
  },
  cancelarText: { fontSize: 14, color: colors.grafiteDim },
  confirmar: {
    flex: 1,
    minHeight: HIT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ferrugem,
  },
  confirmarOff: { backgroundColor: colors.cal3 },
  confirmarText: { fontSize: 14.5, fontWeight: '600', color: colors.sobreFerrugem },

  // a coleção é uma lombada de livro na estante: reta, com o corte colorido
  colecao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: HIT + 16,
    marginTop: space.sm,
    paddingRight: space.md,
    backgroundColor: colors.cal2,
    borderWidth: 1,
    borderColor: colors.calLine,
  },
  colecaoLombada: { width: 8, alignSelf: 'stretch', backgroundColor: colors.esmalte },
  colecaoNome: { fontSize: 16, lineHeight: 18, color: colors.grafite },
  colecaoConta: { fontSize: 12, color: colors.grafiteDim, marginTop: 3 },
});
