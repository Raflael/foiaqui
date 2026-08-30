import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Body, Eyebrow, Mono, Plaque } from '@/components/Type';
import { criterioPor } from '@/data/criterios';
import { geojsonDasMemorias } from '@/data/exportar';
import { useAcervo } from '@/store/acervo';
import { useModeracao } from '@/store/moderacao';
import { alpha, colors, HIT, space } from '@/theme';
import type { Memory } from '@/types';

/**
 * Minhas contribuições.
 *
 * Existia como linha no perfil sem `onPress`: desenhava a seta, anunciava-se
 * como botão para o leitor de tela, e não fazia nada. Botão morto é a mesma
 * mentira de interface que o contador falso era.
 *
 * Ela resolve um beco sem saída real: a regra "ninguém revisa a própria
 * memória" está certa para o produto, mas num aparelho só ela prende o que
 * você cria em revisão para sempre — quem testa nunca chega a ver uma memória
 * sua publicada nem recusada. Aqui há a porta para simular o parecer, marcada
 * como ferramenta de protótipo, e a porta para apagar.
 */
export default function ContribuicoesScreen() {
  const insets = useSafeAreaInsets();
  const criadas = useAcervo((s) => s.criadas);
  const remover = useAcervo((s) => s.remover);
  const pareceres = useModeracao((s) => s.pareceres);

  const emRevisao = criadas.filter((m) => m.status === 'em_revisao');

  const apagar = (m: Memory) =>
    Alert.alert(
      'Apagar esta memória?',
      `"${m.title}" será removida deste aparelho. Não dá para desfazer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Apagar', style: 'destructive', onPress: () => remover(m.id) },
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
          <Eyebrow style={styles.eyebrow}>Suas memórias</Eyebrow>
          <Plaque style={styles.titulo}>
            {criadas.length === 0
              ? 'Nenhuma ainda'
              : criadas.length === 1
                ? '1 contribuição'
                : `${criadas.length} contribuições`}
          </Plaque>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.gutter,
          paddingBottom: insets.bottom + space.xxl,
        }}
        showsVerticalScrollIndicator={false}>
        {criadas.length === 0 ? (
          <View style={styles.vazio}>
            <Icon name="film" size={32} color={colors.grafiteDim} strokeWidth={1.7} />
            <Body style={styles.vazioText}>
              O que você contar aparece aqui, com o estado da revisão.
            </Body>
            <Pressable
              style={styles.contar}
              onPress={() => router.push('/adicionar')}
              accessibilityRole="button"
              accessibilityLabel="Contar uma memória">
              <Body style={styles.contarText}>Contar a primeira</Body>
            </Pressable>
          </View>
        ) : null}

        {emRevisao.length > 0 ? (
          <View style={styles.nota}>
            <Icon name="clock" size={15} color={colors.esmalte} strokeWidth={2.2} />
            <Body style={styles.notaText}>
              {emRevisao.length === 1 ? '1 memória espera' : `${emRevisao.length} memórias esperam`}{' '}
              revisão. Neste protótipo não há outras pessoas para dar o parecer, então elas
              ficariam aqui para sempre — use &ldquo;simular revisão&rdquo; para ver como ficam
              os dois desfechos.
            </Body>
          </View>
        ) : null}

        {criadas.length > 0 ? (
          <Pressable
            style={styles.exportar}
            onPress={() =>
              Share.share({
                title: 'Minhas memórias do FoiAqui',
                message: geojsonDasMemorias(criadas),
              })
            }
            accessibilityRole="button"
            accessibilityLabel="Levar minhas memórias como arquivo GeoJSON">
            <Icon name="share" size={16} color={colors.esmalte} strokeWidth={2.1} />
            <View style={{ flex: 1 }}>
              <Body style={styles.exportarTitulo}>Levar minhas memórias</Body>
              <Body style={styles.exportarNota}>
                GeoJSON com texto e lugar — abre em qualquer mapa. As fotos e áudios ficam no
                aparelho.
              </Body>
            </View>
          </Pressable>
        ) : null}

        {criadas.map((m) => {
          const parecer = pareceres.find((p) => p.memoriaId === m.id);
          const criterio = criterioPor(parecer?.criterioId);
          return (
            <View key={m.id} style={styles.item}>
              <View style={styles.itemTopo}>
                <View style={{ flex: 1 }}>
                  <Plaque style={styles.itemTitulo}>{m.title}</Plaque>
                  <Body style={styles.itemLugar}>{m.place}</Body>
                </View>
                <Mono style={styles.itemAno}>{m.year}</Mono>
              </View>

              <Selo status={m.status ?? 'em_revisao'} />

              {m.status === 'recusada' && criterio ? (
                <View style={styles.motivo}>
                  <Body style={styles.motivoTitulo}>{criterio.recusa}</Body>
                  {parecer?.nota ? (
                    <Body style={styles.motivoNota}>&ldquo;{parecer.nota}&rdquo;</Body>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.acoes}>
                {m.status === 'em_revisao' ? (
                  <Pressable
                    style={styles.acao}
                    onPress={() =>
                      router.push({ pathname: '/moderacao', params: { simular: m.id } })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Simular a revisão da comunidade para ${m.title}`}>
                    <Icon name="shieldCheck" size={15} color={colors.esmalte} strokeWidth={2.2} />
                    <Body style={styles.acaoText}>Simular revisão</Body>
                  </Pressable>
                ) : null}

                <Pressable
                  style={styles.acao}
                  onPress={() => apagar(m)}
                  accessibilityRole="button"
                  accessibilityLabel={`Apagar a memória ${m.title}`}>
                  <Icon name="x" size={15} color={colors.ferrugem} strokeWidth={2.4} />
                  <Body style={styles.acaoApagar}>Apagar</Body>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function Selo({ status }: { status: NonNullable<Memory['status']> }) {
  const mapa = {
    publicada: { rotulo: 'No mapa', cor: colors.conferido, icone: 'checkCircle' as const },
    em_revisao: { rotulo: 'Em revisão', cor: colors.esmalte, icone: 'clock' as const },
    recusada: { rotulo: 'Recusada', cor: colors.ferrugem, icone: 'x' as const },
  };
  const s = mapa[status];
  return (
    <View style={styles.selo}>
      <Icon name={s.icone} size={13} color={s.cor} strokeWidth={2.3} />
      <Body style={[styles.seloText, { color: s.cor }]}>{s.rotulo}</Body>
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
  titulo: { fontSize: 21, color: colors.sobreEsmalte, marginTop: 2 },

  vazio: { alignItems: 'center', gap: space.md, paddingTop: 64 },
  vazioText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.grafiteDim,
    textAlign: 'center',
    paddingHorizontal: space.xl,
  },
  contar: {
    minHeight: HIT,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ferrugem,
    marginTop: space.sm,
  },
  contarText: { fontSize: 14.5, fontWeight: '600', color: colors.sobreFerrugem },

  nota: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
    marginTop: space.lg,
    padding: space.lg,
    backgroundColor: colors.cal2,
  },
  notaText: { flex: 1, fontSize: 12.5, lineHeight: 18.5, color: colors.grafiteDim },

  exportar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    marginTop: space.lg,
    padding: space.lg,
    borderWidth: 1.5,
    borderColor: colors.esmalte,
    minHeight: HIT,
  },
  exportarTitulo: { fontSize: 14, fontWeight: '600', color: colors.esmalte },
  exportarNota: { fontSize: 12, lineHeight: 17, color: colors.grafiteDim, marginTop: 2 },

  item: {
    marginTop: space.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.calLine,
    backgroundColor: colors.cal2,
    gap: space.sm,
  },
  itemTopo: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  itemTitulo: { fontSize: 17, lineHeight: 19, color: colors.grafite },
  itemLugar: { fontSize: 12.5, color: colors.grafiteDim, marginTop: 3 },
  itemAno: { fontSize: 13, color: colors.esmalte },

  selo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  seloText: { fontSize: 12.5, fontWeight: '600' },

  motivo: {
    padding: space.md,
    backgroundColor: alpha.ferrugemTinta,
    borderLeftWidth: 3,
    borderLeftColor: colors.ferrugem,
  },
  motivoTitulo: { fontSize: 13, lineHeight: 18.5, color: colors.grafite },
  motivoNota: {
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.grafiteDim,
    marginTop: 5,
    fontStyle: 'italic',
  },

  acoes: { flexDirection: 'row', gap: space.md, marginTop: 2 },
  acao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: HIT,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderColor: colors.calLine,
    backgroundColor: colors.cal,
  },
  acaoText: { fontSize: 13.5, fontWeight: '600', color: colors.esmalte },
  acaoApagar: { fontSize: 13.5, fontWeight: '600', color: colors.ferrugem },
});
