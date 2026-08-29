import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import { Body, Mono, Plaque } from '@/components/Type';
import { eras } from '@/data/memories';
import { colors, HIT, radius, space } from '@/theme';

const TAGS = ['Cinema', 'Lazer', 'Centro', 'Demolido', 'Família', 'Arte urbana', 'Escola'];

const STEPS = ['Mídia', 'História', 'Local', 'Época'] as const;

/**
 * Adicionar memória — fluxo guiado, um assunto por tela.
 *
 * Um passo por vez em vez de um formulário longo: a persona mais importante
 * aqui tem 70 anos e vai preencher isso em pé, na rua. Data e local são
 * obrigatórios (decisão de produto: memória sem quando/onde não vira pin).
 *
 * Front-only: a captura de mídia é simulada. Quando entrar `expo-image-picker`,
 * só `pickMedia()` muda.
 */
export default function AdicionarScreen() {
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [story, setStory] = useState('');
  const [era, setEra] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const toggleTag = (tag: string) =>
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));

  // o local vem do GPS já preenchido, então o passo 3 nasce válido
  const canContinue = [hasPhoto, story.trim().length >= 10, true, era !== null][step];
  const isLast = step === STEPS.length - 1;

  const submit = () => {
    setSending(true);
    // simula a subida da memória; sem rede nesta fase
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 1200);
  };

  if (sent) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={[styles.sheet, styles.done, { paddingTop: space.xxl }]}>
          <View style={styles.doneIcon}>
            <Icon name="shieldCheck" size={34} color={colors.conferido} strokeWidth={1.8} />
          </View>
          <Plaque style={styles.doneTitle}>Memória enviada</Plaque>
          <Body style={styles.doneText}>
            Ela passa por uma checagem rápida da comunidade antes de aparecer no mapa. Você
            recebe um aviso quando isso acontecer.
          </Body>
          <Pressable
            style={styles.primary}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar ao mapa">
            <Body style={styles.primaryText}>Voltar ao mapa</Body>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.sheet}>
        <View style={[styles.head, { paddingTop: space.gutter }]}>
          <Plaque style={styles.title}>Nova memória</Plaque>
          <Pressable
            style={styles.close}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Fechar sem enviar">
            <Icon name="x" size={17} color={colors.grafite} strokeWidth={2.2} />
          </Pressable>
        </View>

        <View
          style={styles.steps}
          accessibilityRole="progressbar"
          accessibilityLabel={`Passo ${step + 1} de ${STEPS.length}: ${STEPS[step]}`}>
          {STEPS.map((label, i) => (
            <View key={label} style={[styles.stepBar, i <= step && styles.stepBarOn]} />
          ))}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {step === 0 ? (
            <>
              <Label text="Foto ou vídeo" required />
              <Pressable
                onPress={() => setHasPhoto((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={
                  hasPhoto ? 'Trocar a foto escolhida' : 'Tirar foto ou enviar da galeria'
                }>
                {hasPhoto ? (
                  <PhotoPlaceholder variant="past" style={styles.photoFilled}>
                    <View style={styles.photoSwap}>
                      <Icon name="image" size={16} color="#FFFFFF" />
                      <Body style={styles.photoSwapText}>Trocar</Body>
                    </View>
                  </PhotoPlaceholder>
                ) : (
                  <View style={styles.photobox}>
                    <Icon name="camera" size={30} color={colors.esmalte} strokeWidth={1.8} />
                    <Body style={styles.photoboxTitle}>Tirar foto ou enviar da galeria</Body>
                    <Body style={styles.photoboxHint}>
                      Tem foto de papel? A gente te ajuda a enquadrar.
                    </Body>
                  </View>
                )}
              </Pressable>

              <Label text="Áudio" hint="quem viveu contando — vale mais que legenda" />
              <Pressable
                style={[styles.audioBtn, hasAudio && styles.audioBtnOn]}
                onPress={() => setHasAudio((v) => !v)}
                accessibilityRole="button"
                accessibilityState={{ selected: hasAudio }}
                accessibilityLabel={
                  hasAudio ? 'Remover o áudio gravado' : 'Gravar um relato em áudio'
                }>
                <Icon
                  name={hasAudio ? 'checkCircle' : 'play'}
                  size={20}
                  color={hasAudio ? colors.conferido : colors.esmalte}
                />
                <Body style={styles.audioBtnText}>
                  {hasAudio ? 'Áudio gravado · 0:48' : 'Gravar um relato'}
                </Body>
              </Pressable>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Label text="A história" required />
              <TextInput
                style={styles.textarea}
                value={story}
                onChangeText={setStory}
                multiline
                placeholder="O que aconteceu aqui? Conte o causo, quem viveu, o que mudou…"
                placeholderTextColor="#A89A82"
                accessibilityLabel="A história desta memória"
              />
              <Body style={styles.counter}>
                {story.trim().length < 10
                  ? 'Escreva pelo menos uma frase.'
                  : `${story.trim().length} caracteres`}
              </Body>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Label text="Local" required />
              <View style={styles.locMap}>
                <PhotoPlaceholder variant="present" style={StyleSheet.absoluteFill} />
                <View style={styles.locPin}>
                  <Icon name="pinSolid" size={26} color={colors.ferrugem} />
                </View>
                <View style={styles.locTag}>
                  <Mono style={styles.locGps}>GPS</Mono>
                  <Body style={styles.locText}>Rua do Comércio, 210 · toque p/ ajustar</Body>
                </View>
              </View>
              <Body style={styles.help}>
                Sem sinal bom? Dá pra arrastar o pin depois — o importante é não deixar a
                memória sem endereço.
              </Body>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Label text="Época" required />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}>
                {eras.map((e) => (
                  <Chip
                    key={e}
                    label={e}
                    mono
                   
                    tone="ferrugem"
                    active={era === e}
                    onPress={() => setEra(e)}
                  />
                ))}
              </ScrollView>

              <Label text="Marcadores" />
              <View style={styles.tagWrap}>
                {TAGS.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                   
                    tone="esmalte"
                    active={tags.includes(t)}
                    onPress={() => toggleTag(t)}
                  />
                ))}
              </View>

              <View style={styles.modNote}>
                <Icon name="shieldCheck" size={16} color={colors.conferido} />
                <Body style={styles.modNoteText}>
                  Sua memória passa por uma checagem rápida da comunidade antes de aparecer no
                  mapa.
                </Body>
              </View>
            </>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
          {step > 0 ? (
            <Pressable
              style={styles.secondary}
              onPress={() => setStep((s) => s - 1)}
              accessibilityRole="button"
              accessibilityLabel="Voltar ao passo anterior">
              <Icon name="chevronLeft" size={18} color={colors.grafite} />
              <Body style={styles.secondaryText}>Voltar</Body>
            </Pressable>
          ) : null}

          <Pressable
            style={[styles.primary, { flex: 1 }, !canContinue && styles.primaryOff]}
            disabled={!canContinue || sending}
            onPress={() => (isLast ? submit() : setStep((s) => s + 1))}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canContinue || sending }}
            accessibilityLabel={isLast ? 'Enviar memória' : 'Continuar para o próximo passo'}>
            <Body style={[styles.primaryText, !canContinue && styles.primaryTextOff]}>
              {sending ? 'Enviando…' : isLast ? 'Enviar memória' : 'Continuar'}
            </Body>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function Label({ text, required, hint }: { text: string; required?: boolean; hint?: string }) {
  return (
    <View style={styles.label}>
      <Body style={styles.labelText}>
        {text}
        {required ? <Body style={styles.required}> *</Body> : null}
      </Body>
      {hint ? <Body style={styles.labelHint}>{hint}</Body> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cal },
  sheet: {
    flex: 1,
    marginTop: space.sm,
    backgroundColor: colors.cal,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
  },

  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  title: { fontSize: 24, letterSpacing: -0.3, color: colors.grafite },
  close: {
    width: HIT,
    height: HIT,
    borderRadius: HIT / 2,
    backgroundColor: colors.cal2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  steps: { flexDirection: 'row', gap: 6, paddingHorizontal: 22, marginTop: space.gutter },
  stepBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.calLine },
  stepBarOn: { backgroundColor: colors.ferrugem },

  body: { paddingHorizontal: 22, paddingTop: space.xxl, paddingBottom: space.xl },

  label: { marginBottom: space.sm, marginTop: space.gutter },
  labelText: { fontSize: 12.5, fontWeight: '700', color: colors.grafite },
  labelHint: { fontSize: 12, color: colors.grafiteDim, marginTop: 3 },
  required: { fontSize: 12.5, fontWeight: '700', color: colors.esmalte },

  photobox: {
    height: 150,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.calLine,
    backgroundColor: colors.cal2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingHorizontal: space.xl,
  },
  photoboxTitle: { fontSize: 14, fontWeight: '700', color: colors.grafite, textAlign: 'center' },
  photoboxHint: { fontSize: 12, color: colors.grafiteDim, textAlign: 'center' },
  photoFilled: { height: 150, borderRadius: radius.md },
  photoSwap: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  photoSwapText: { fontSize: 12.5, fontWeight: '600', color: '#FFFFFF' },

  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: HIT + 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.calLine,
    backgroundColor: colors.cal2,
  },
  audioBtnOn: { borderColor: colors.conferido },
  audioBtnText: { fontSize: 14, fontWeight: '600', color: colors.grafite },

  textarea: {
    minHeight: 140,
    backgroundColor: colors.cal2,
    borderWidth: 1,
    borderColor: colors.calLine,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    color: colors.grafite,
    textAlignVertical: 'top',
  },
  counter: { fontSize: 12, color: colors.grafiteDim, marginTop: space.sm },

  locMap: {
    height: 150,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.calLine,
  },
  locPin: { position: 'absolute', left: '50%', top: '40%', marginLeft: -13 },
  locTag: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cal,
    borderWidth: 1,
    borderColor: colors.calLine,
    borderRadius: radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  locGps: { fontSize: 10, color: colors.conferido, fontWeight: '700' },
  locText: { flex: 1, fontSize: 11.5, fontWeight: '600', color: colors.grafite },
  help: { fontSize: 12.5, lineHeight: 18, color: colors.grafiteDim, marginTop: space.md },

  chipRow: { gap: space.sm, paddingRight: space.xl },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },

  modNote: {
    flexDirection: 'row',
    gap: 9,
    marginTop: space.xxl,
    alignItems: 'flex-start',
  },
  modNoteText: { flex: 1, fontSize: 12, lineHeight: 17, color: colors.grafiteDim },

  footer: {
    flexDirection: 'row',
    gap: space.md,
    paddingHorizontal: 22,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.calLine,
  },
  primary: {
    minHeight: HIT + 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.ferrugem,
    paddingHorizontal: space.xl,
  },
  // desabilitado precisa continuar legivel: fundo cal3 com texto grafiteDim
  // da 5.68:1, contra o texto claro sobre calLine que reprovava
  primaryOff: { backgroundColor: colors.cal3 },
  primaryTextOff: { color: colors.grafiteDim },
  primaryText: { fontSize: 15.5, fontWeight: '700', color: colors.sobreFerrugem },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: HIT + 8,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.calLine,
    backgroundColor: colors.cal2,
  },
  secondaryText: { fontSize: 14.5, fontWeight: '600', color: colors.grafite },

  done: { alignItems: 'center', paddingHorizontal: space.xxl, gap: space.lg },
  doneIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.cal2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: { fontSize: 26, color: colors.grafite, textAlign: 'center' },
  doneText: { fontSize: 14.5, lineHeight: 22, color: colors.grafiteDim, textAlign: 'center' },
});
