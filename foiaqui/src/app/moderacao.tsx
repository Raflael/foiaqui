import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import { Plaque as PlaquePlate } from '@/components/Plaque';
import { Body, Eyebrow, Mono, Plaque, Story } from '@/components/Type';
import { criterios } from '@/data/criterios';
import { useAcervo } from '@/store/acervo';
import { useFila, useModeracao, useRevisoes } from '@/store/moderacao';
import { colors, HIT, radius, space } from '@/theme';
import type { Memory } from '@/types';

/**
 * A fila de revisão da comunidade (Decisão 5).
 *
 * Duas escolhas de interface que vieram direto do benchmarking:
 *
 * Os critérios ficam ABERTOS na tela, acima da memória — não escondidos atrás
 * de um "saiba mais". O revisor precisa da régua na mão enquanto julga, e quem
 * envia precisa poder ler a mesma régua antes. Critério que só o moderador
 * conhece é armadilha.
 *
 * Recusar não é um botão, é um caminho: escolher qual critério falhou e, se
 * quiser, escrever um recado. É o oposto da moderação opaca do Google Maps,
 * onde o autor não descobre por que sumiu. Aprovar é um toque só — o custo
 * assimétrico é proposital, porque recusar o trabalho de alguém deve custar
 * mais do que aceitar.
 */
export default function ModeracaoScreen() {
  const insets = useSafeAreaInsets();
  const fila = useFila();
  const revisoes = useRevisoes();
  const registrar = useModeracao((s) => s.registrar);
  const pular = useModeracao((s) => s.pular);
  const reabrir = useModeracao((s) => s.reabrir);
  const minhasEmRevisao = useAcervo((s) => s.criadas).filter(
    (m) => m.status === 'em_revisao',
  ).length;

  const [recusando, setRecusando] = useState(false);
  const [criterioId, setCriterioId] = useState<string | null>(null);
  const [nota, setNota] = useState('');

  const atual = fila[0];

  const limpar = () => {
    setRecusando(false);
    setCriterioId(null);
    setNota('');
  };

  const aprovar = () => {
    if (!atual) return;
    registrar({ memoriaId: atual.id, decisao: 'aprovada', quando: Date.now() });
    limpar();
  };

  const confirmarRecusa = () => {
    if (!atual || !criterioId) return;
    registrar({
      memoriaId: atual.id,
      decisao: 'recusada',
      criterioId,
      nota: nota.trim() || undefined,
      quando: Date.now(),
    });
    limpar();
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
        <View style={styles.tituloBloco}>
          <Eyebrow style={styles.eyebrow}>Revisão da comunidade</Eyebrow>
          <Plaque style={styles.titulo}>
            {fila.length > 0 ? `${fila.length} na fila` : 'Fila vazia'}
          </Plaque>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.gutter,
          paddingBottom: insets.bottom + space.xxl,
        }}
        showsVerticalScrollIndicator={false}>
        {atual ? (
          <>
            <Regua />
            <MemoriaEmAnalise memory={atual} />

            {recusando ? (
              <Recusa
                criterioId={criterioId}
                onCriterio={setCriterioId}
                nota={nota}
                onNota={setNota}
                onCancelar={limpar}
                onConfirmar={confirmarRecusa}
              />
            ) : (
              <View style={styles.acoes}>
                <Pressable
                  style={({ pressed }) => [styles.aprovar, pressed && styles.pressionado]}
                  onPress={aprovar}
                  accessibilityRole="button"
                  accessibilityLabel={`Aprovar a memória ${atual.title}. Ela passa a aparecer no mapa.`}>
                  <Icon
                    name="checkCircle"
                    size={19}
                    color={colors.sobreEsmalte}
                    strokeWidth={2.2}
                  />
                  <Body style={styles.aprovarText}>Aprovar</Body>
                </Pressable>

                <View style={styles.acoesSecundarias}>
                  <Pressable
                    style={({ pressed }) => [styles.recusar, pressed && styles.pressionado]}
                    onPress={() => setRecusando(true)}
                    accessibilityRole="button"
                    accessibilityLabel={`Recusar a memória ${atual.title}. Você vai precisar dizer qual critério ela não cumpre.`}>
                    <Icon name="x" size={17} color={colors.ferrugem} strokeWidth={2.4} />
                    <Body style={styles.recusarText}>Recusar</Body>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.pular, pressed && styles.pressionado]}
                    onPress={() => {
                      pular(atual.id);
                      limpar();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Não sei julgar esta memória. Ela vai para outra pessoa.">
                    <Body style={styles.pularText}>Não sei julgar</Body>
                  </Pressable>
                </View>

                <Body style={styles.rodape}>
                  Aprovar publica no mapa. Recusar exige dizer qual critério falhou — quem
                  enviou vai ler.
                </Body>
              </View>
            )}
          </>
        ) : (
          <FilaVazia revisoes={revisoes} onReabrir={reabrir} />
        )}

        {minhasEmRevisao > 0 ? (
          <View style={styles.suas}>
            <Icon name="clock" size={15} color={colors.esmalte} strokeWidth={2.2} />
            <Body style={styles.suasText}>
              {minhasEmRevisao === 1
                ? 'Você tem 1 memória esperando revisão.'
                : `Você tem ${minhasEmRevisao} memórias esperando revisão.`}{' '}
              Elas não aparecem aqui — ninguém revisa a própria. Neste protótipo não há
              outras pessoas para revisá-las; com backend, elas entram na fila de quem
              estiver por perto.
            </Body>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

/**
 * Os critérios ficam à vista enquanto se julga — mas as PERGUNTAS, não os
 * parágrafos.
 *
 * A primeira versão abria tudo e comia meia tela em cada memória. Régua que
 * empurra o conteúdo para fora da vista deixa de ser régua e vira preâmbulo:
 * na terceira revisão a pessoa rola por cima sem ler. Quatro perguntas de uma
 * linha cabem na cabeça; a explicação fica a um toque, para a dúvida real.
 */
function Regua() {
  const [aberta, setAberta] = useState(false);

  return (
    <View style={styles.regua}>
      <Pressable
        style={styles.reguaTopo}
        onPress={() => setAberta((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberta }}
        accessibilityLabel={
          aberta ? 'Esconder o que conta em cada critério' : 'Ver o que conta em cada critério'
        }>
        <Eyebrow style={styles.reguaTitulo}>Os critérios</Eyebrow>
        <Body style={styles.reguaToggle}>{aberta ? 'esconder' : 'o que conta'}</Body>
      </Pressable>

      {criterios.map((c) => (
        <View key={c.id} style={styles.criterio}>
          <Icon name={c.icon} size={15} color={colors.esmalte} strokeWidth={2.1} />
          <View style={styles.criterioTexto}>
            <Body style={styles.criterioPergunta}>{c.pergunta}</Body>
            {aberta ? (
              <Body style={styles.criterioExplicacao}>{c.explicacao}</Body>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function MemoriaEmAnalise({ memory }: { memory: Memory }) {
  const temFoto = memory.media.some((m) => m.type === 'photo');
  const temAudio = memory.media.some((m) => m.type === 'audio');

  return (
    <View style={styles.cartao}>
      {temFoto ? (
        <PhotoPlaceholder
          variant={memory.era === 'Atual' ? 'present' : 'past'}
          style={styles.foto}
        />
      ) : (
        <View style={styles.semFoto}>
          <Icon name="image" size={22} color={colors.grafiteDim} />
          <Body style={styles.semFotoText}>Sem imagem</Body>
        </View>
      )}

      <PlaquePlate style={styles.chapa}>
        <Eyebrow style={styles.chapaMarker}>{memory.marker}</Eyebrow>
        <Plaque style={styles.chapaTitulo}>{memory.title}</Plaque>
        <Mono style={styles.chapaPeriodo}>{memory.period}</Mono>
        <Plaque weight="semibold" style={styles.chapaLugar}>
          {memory.place}
        </Plaque>
      </PlaquePlate>

      <Story style={styles.relato}>{memory.story}</Story>

      <View style={styles.meta}>
        <Icon name="user" size={14} color={colors.grafiteDim} />
        <Body style={styles.metaText}>
          {memory.author.name} · {memory.author.role}
        </Body>
      </View>
      <View style={styles.meta}>
        <Icon name={temAudio ? 'play' : 'film'} size={14} color={colors.grafiteDim} />
        <Body style={styles.metaText}>
          {memory.kind}
          {temAudio && memory.audioSeconds ? ` · áudio de ${memory.audioSeconds}s` : ''}
        </Body>
      </View>
    </View>
  );
}

/** Recusar exige apontar o critério. É o que a torna justificada. */
function Recusa({
  criterioId,
  onCriterio,
  nota,
  onNota,
  onCancelar,
  onConfirmar,
}: {
  criterioId: string | null;
  onCriterio: (id: string) => void;
  nota: string;
  onNota: (v: string) => void;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  return (
    <View style={styles.recusaBloco}>
      <Plaque style={styles.recusaTitulo}>Qual critério não foi cumprido?</Plaque>
      <Body style={styles.recusaAjuda}>
        Quem enviou vai ler isto. Sem escolher um critério, não dá para recusar.
      </Body>

      {criterios.map((c) => {
        const escolhido = criterioId === c.id;
        return (
          <Pressable
            key={c.id}
            style={[styles.opcao, escolhido && styles.opcaoOn]}
            onPress={() => onCriterio(c.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: escolhido }}
            accessibilityLabel={c.pergunta}>
            <View style={[styles.marca, escolhido && styles.marcaOn]}>
              {escolhido ? (
                <Icon name="x" size={12} color={colors.sobreFerrugem} strokeWidth={3} />
              ) : null}
            </View>
            <View style={styles.opcaoTexto}>
              <Body style={styles.opcaoPergunta}>{c.pergunta}</Body>
              <Body style={styles.opcaoRecusa}>{c.recusa}</Body>
            </View>
          </Pressable>
        );
      })}

      <Body style={styles.notaRotulo}>Quer explicar melhor? (opcional)</Body>
      <TextInput
        style={styles.notaCampo}
        value={nota}
        onChangeText={onNota}
        placeholder="Um recado curto para quem enviou"
        placeholderTextColor={colors.grafiteDim}
        multiline
        maxLength={240}
        accessibilityLabel="Recado para quem enviou a memória"
      />

      <View style={styles.recusaAcoes}>
        <Pressable
          style={styles.cancelar}
          onPress={onCancelar}
          accessibilityRole="button"
          accessibilityLabel="Cancelar a recusa">
          <Body style={styles.cancelarText}>Voltar</Body>
        </Pressable>
        <Pressable
          style={[styles.confirmar, !criterioId && styles.confirmarOff]}
          onPress={onConfirmar}
          disabled={!criterioId}
          accessibilityRole="button"
          accessibilityState={{ disabled: !criterioId }}
          accessibilityLabel="Confirmar a recusa com o motivo escolhido">
          <Body style={styles.confirmarText}>Recusar com esse motivo</Body>
        </Pressable>
      </View>
    </View>
  );
}

function FilaVazia({ revisoes, onReabrir }: { revisoes: number; onReabrir: () => void }) {
  return (
    <View style={styles.vazia}>
      <Icon name="shieldCheck" size={34} color={colors.conferido} strokeWidth={1.7} />
      <Plaque style={styles.vaziaTitulo}>Nada esperando você</Plaque>
      <Body style={styles.vaziaTexto}>
        {revisoes > 0
          ? `Você já deu ${revisoes === 1 ? 'um parecer' : `${revisoes} pareceres`}. As memórias que você aprovou estão no mapa; as recusadas voltaram para quem enviou, com o motivo.`
          : 'Quando alguém enviar uma memória por perto, ela aparece aqui para a comunidade conferir.'}
      </Body>
      {revisoes > 0 ? (
        <Pressable
          style={styles.reabrir}
          onPress={onReabrir}
          accessibilityRole="button"
          accessibilityLabel="Devolver as memórias para a fila e revisar de novo">
          <Body style={styles.reabrirText}>Revisar tudo de novo</Body>
        </Pressable>
      ) : null}
      <Body style={styles.vaziaNota}>
        Neste protótipo uma revisão já basta para publicar. Em produção seriam vários
        pareceres concordantes, de pessoas diferentes — o que um aparelho sozinho não
        consegue simular sem mentir.
      </Body>
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
  tituloBloco: { flex: 1 },
  eyebrow: { color: colors.sobreEsmalteDim },
  titulo: { fontSize: 21, color: colors.sobreEsmalte, marginTop: 2 },

  // a régua
  regua: {
    marginTop: space.lg,
    padding: space.lg,
    backgroundColor: colors.cal2,
    borderLeftWidth: 3,
    borderLeftColor: colors.esmalte,
    gap: space.md,
  },
  reguaTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 28,
  },
  reguaTitulo: { color: colors.esmalte },
  // esmalte, não ferrugem: sobre cal2 a ferrugem dá 4,43:1 e reprova em AA.
  // Dentro do bloco azul dos critérios ela também é a voz certa.
  reguaToggle: { fontSize: 12.5, fontWeight: '600', color: colors.esmalte },
  criterio: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', minHeight: 22 },
  criterioTexto: { flex: 1 },
  criterioPergunta: { fontSize: 13.5, fontWeight: '600', color: colors.grafite },
  criterioExplicacao: {
    fontSize: 12.5,
    lineHeight: 17.5,
    color: colors.grafiteDim,
    marginTop: 2,
  },

  // a memória em análise
  cartao: { marginTop: space.lg },
  foto: { height: 190, borderRadius: radius.none },
  semFoto: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.cal3,
  },
  semFotoText: { fontSize: 12.5, color: colors.grafiteDim },
  chapa: { marginTop: -1 },
  chapaMarker: { color: colors.sobreEsmalteDim },
  chapaTitulo: { fontSize: 24, lineHeight: 26, color: colors.sobreEsmalte, marginTop: 4 },
  chapaPeriodo: { fontSize: 13, color: colors.sobreEsmalteDim, marginTop: 8 },
  chapaLugar: { fontSize: 12.5, color: colors.sobreEsmalteDim, marginTop: 6 },
  relato: { fontSize: 15.5, lineHeight: 24, color: colors.grafite, marginTop: space.lg },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: space.sm },
  metaText: { fontSize: 12.5, color: colors.grafiteDim },

  // ações
  acoes: { marginTop: space.xl, gap: space.md },
  aprovar: {
    minHeight: HIT + 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    backgroundColor: colors.conferido,
  },
  aprovarText: { fontSize: 15.5, fontWeight: '600', color: colors.sobreEsmalte },
  acoesSecundarias: { flexDirection: 'row', gap: space.md },
  recusar: {
    flex: 1,
    minHeight: HIT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1.5,
    borderColor: colors.ferrugem,
  },
  recusarText: { fontSize: 14.5, fontWeight: '600', color: colors.ferrugem },
  pular: {
    flex: 1,
    minHeight: HIT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.calLine,
  },
  pularText: { fontSize: 14, color: colors.grafiteDim },
  pressionado: { opacity: 0.82 },
  rodape: {
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.grafiteDim,
    textAlign: 'center',
    marginTop: 2,
  },

  // recusa
  recusaBloco: { marginTop: space.xl, gap: space.sm },
  recusaTitulo: { fontSize: 17, color: colors.grafite },
  recusaAjuda: {
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.grafiteDim,
    marginBottom: space.sm,
  },
  opcao: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
    padding: space.md,
    minHeight: HIT,
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
  opcaoTexto: { flex: 1 },
  opcaoPergunta: { fontSize: 13.5, fontWeight: '600', color: colors.grafite },
  opcaoRecusa: { fontSize: 12.5, lineHeight: 17.5, color: colors.grafiteDim, marginTop: 2 },

  notaRotulo: { fontSize: 13, color: colors.grafite, marginTop: space.md },
  notaCampo: {
    minHeight: 78,
    padding: space.md,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.calLine,
    backgroundColor: colors.cal2,
    color: colors.grafite,
    fontSize: 14.5,
  },
  recusaAcoes: { flexDirection: 'row', gap: space.md, marginTop: space.md },
  cancelar: {
    minHeight: HIT,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.calLine,
  },
  cancelarText: { fontSize: 14.5, color: colors.grafiteDim },
  confirmar: {
    flex: 1,
    minHeight: HIT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ferrugem,
  },
  confirmarOff: { opacity: 0.4 },
  confirmarText: { fontSize: 14.5, fontWeight: '600', color: colors.sobreFerrugem },

  // fila vazia
  vazia: { alignItems: 'center', gap: space.md, paddingTop: 64, paddingHorizontal: space.md },
  vaziaTitulo: { fontSize: 20, color: colors.grafite },
  vaziaTexto: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.grafiteDim,
    textAlign: 'center',
  },
  reabrir: {
    minHeight: HIT,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.esmalte,
    marginTop: space.sm,
  },
  reabrirText: { fontSize: 14.5, fontWeight: '600', color: colors.esmalte },
  vaziaNota: {
    fontSize: 12,
    lineHeight: 17.5,
    color: colors.grafiteDim,
    textAlign: 'center',
    marginTop: space.lg,
  },

  // suas memórias
  suas: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
    marginTop: space.xl,
    padding: space.lg,
    backgroundColor: colors.cal2,
  },
  suasText: { flex: 1, fontSize: 12.5, lineHeight: 18.5, color: colors.grafiteDim },
});
