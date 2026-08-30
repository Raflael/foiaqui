import {
  AudioModule,
  RecordingPresets,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { Body, Mono, Plaque } from '@/components/Type';
import type { Position } from '@/data/location';
import { mapStyle } from '@/data/mapStyle';
import { eras } from '@/data/memories';
import { useCurrentPosition } from '@/hooks/useCurrentPosition';
import { useAcervo } from '@/store/acervo';
import { colors, HIT, radius, space } from '@/theme';
import type { Memory } from '@/types';

const TAGS = ['Cinema', 'Lazer', 'Centro', 'Demolido', 'Família', 'Arte urbana', 'Escola'];

const STEPS = ['Mídia', 'História', 'Local', 'Época'] as const;

/** A época escolhida vira um ano concreto, que é o que a placa mostra. */
const ANO_DA_ERA: Record<string, string> = {
  'Anos 40': '1940',
  'Anos 50': '1950',
  'Anos 60': '1960',
  'Anos 70': '1970',
};

/**
 * Título a partir do relato: a primeira frase, ou o começo dela.
 * Sem regex de propósito — a escapagem de "
" dentro de literal já quebrou
 * este arquivo uma vez, e aqui ela não acrescenta nada.
 */
function tituloDoRelato(texto: string): string {
  const limpo = texto.trim();
  if (!limpo) return 'Memória sem título';
  const frase = limpo.split('.')[0].trim();
  const base = frase.length >= 8 ? frase : limpo;
  return base.length <= 48 ? base : base.slice(0, 47).trimEnd() + '…';
}

/** `null` quando ainda não há gravação — o player aceita fonte vazia. */
const audioSource = (uri?: string) => (uri ? { uri } : null);

/** 78 -> "1:18" */
const formatSeconds = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/**
 * Adicionar memória — fluxo guiado, um assunto por tela.
 *
 * Um passo por vez em vez de um formulário longo: a persona mais importante
 * aqui tem 70 anos e vai preencher isso em pé, na rua. Data e local são
 * obrigatórios (decisão de produto: memória sem quando/onde não vira pin).
 *
 * A captura de foto, vídeo e áudio é real. O que ainda é simulado é o envio:
 * não há backend, então o "enviar" espera e mostra a mensagem de moderação.
 */
export default function AdicionarScreen() {
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [media, setMedia] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);
  /** A vista de hoje, opcional — é ela que faz o antes↔depois existir. */
  const [hoje, setHoje] = useState<string | null>(null);
  const [audio, setAudio] = useState<{ uri: string; seconds: number } | null>(null);
  const [mediaErro, setMediaErro] = useState<string | null>(null);

  const { position, source } = useCurrentPosition();
  const adicionarAoAcervo = useAcervo((s) => s.adicionar);
  const locMapRef = useRef<MapView>(null);
  const [local, setLocal] = useState<Position | null>(null);
  const [endereco, setEndereco] = useState<string | null>(null);
  // o local nasce onde a pessoa está; ela ajusta se a memória for logo ali adiante
  const alvo = local ?? position;

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);
  // ouvir o próprio relato antes de enviar: sem isto a pessoa grava no escuro
  const player = useAudioPlayer(audioSource(audio?.uri));
  const playing = useAudioPlayerStatus(player).playing;
  const [story, setStory] = useState('');
  const [era, setEra] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const toggleTag = (tag: string) =>
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));

  // o local nasce preenchido pelo GPS, então este passo já nasce válido
  const canContinue = [media !== null, story.trim().length >= 10, true, era !== null][step];
  const isLast = step === STEPS.length - 1;

  /** Guarda o que voltou do seletor no destino certo. */
  const guardar = (r: ImagePicker.ImagePickerResult, destino: 'memoria' | 'hoje') => {
    if (r.canceled || !r.assets?.[0]) return;
    const a = r.assets[0];
    setMediaErro(null);
    if (destino === 'hoje') setHoje(a.uri);
    else setMedia({ uri: a.uri, type: a.type === 'video' ? 'video' : 'image' });
  };

  const tirarFoto = async (destino: 'memoria' | 'hoje' = 'memoria') => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setMediaErro('Sem acesso à câmera. Você ainda pode enviar da galeria.');
      return;
    }
    guardar(
      await ImagePicker.launchCameraAsync({
        // só foto: pedir imagem E vídeo abria a câmera num modo ambíguo,
        // sem disparador claro. Vídeo entra pela galeria ou por um botão
        // próprio, quando houver.
        mediaTypes: ['images'],
        quality: 0.85,
      }),
      destino,
    );
  };

  const escolherDaGaleria = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setMediaErro('Sem acesso às suas fotos. Você ainda pode tirar uma foto agora.');
      return;
    }
    guardar(
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.85,
      }),
      'memoria',
    );
  };

  const gravarAudio = async () => {
    if (recState.isRecording) {
      await recorder.stop();
      setAudio({
        uri: recorder.uri ?? '',
        seconds: Math.max(1, Math.round(recState.durationMillis / 1000)),
      });
      return;
    }
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) {
      setMediaErro('Sem acesso ao microfone. O relato em áudio é opcional.');
      return;
    }
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  /**
   * O mapa do local lia a posição uma vez, na montagem. Se o GPS ainda não
   * tinha respondido, congelava no fallback e a memória nascia no lugar errado.
   * Agora ele vai até você quando a primeira leitura real chega — uma vez só,
   * para não brigar com quem já arrastou o mapa.
   */
  const seguiuGps = useRef(false);
  useEffect(() => {
    if (step !== 2 || source !== 'gps' || seguiuGps.current) return;
    seguiuGps.current = true;
    setLocal({ lat: position.lat, lng: position.lng });
    locMapRef.current?.animateCamera(
      { center: { latitude: position.lat, longitude: position.lng } },
      { duration: 300 },
    );
  }, [step, source, position.lat, position.lng]);

  /**
   * Endereço a partir da coordenada. Roda quando o mapa para de se mexer,
   * não a cada quadro — geocodificação é chamada cara e com limite.
   */
  useEffect(() => {
    if (step !== 2) return;
    let vivo = true;
    setEndereco(null);
    (async () => {
      try {
        const [r] = await Location.reverseGeocodeAsync({
          latitude: alvo.lat,
          longitude: alvo.lng,
        });
        if (!vivo) return;
        const rua = [r?.street, r?.streetNumber].filter(Boolean).join(', ');
        setEndereco([rua, r?.district, r?.city].filter(Boolean).join(' · ') || null);
      } catch {
        if (vivo) setEndereco(null);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [step, alvo.lat, alvo.lng]);

  /**
   * "Enviar" era um `setTimeout` que mostrava a mensagem de moderação e jogava
   * tudo fora. Agora guarda de verdade no aparelho, com status `em_revisao`:
   * quem enviou vê a própria memória no mapa, marcada, mas ela ainda não foi
   * conferida pela comunidade (Decisão 5).
   *
   * O que continua simulado é a espera — não há backend para subir a mídia.
   */
  const submit = () => {
    setSending(true);
    const agora = new Date();
    const nova: Memory = {
      id: `local-${agora.getTime()}`,
      title: tituloDoRelato(story),
      shortName: (endereco?.split(',')[0] ?? 'Aqui').slice(0, 14),
      marker: era === 'Atual' ? 'Aqui está' : 'Aqui foi',
      period: era ?? String(agora.getFullYear()),
      year: era === 'Atual' ? String(agora.getFullYear()) : (ANO_DA_ERA[era ?? ''] ?? '—'),
      era: era ?? 'Atual',
      place: endereco ?? 'Local marcado no mapa',
      coords: { lat: alvo.lat, lng: alvo.lng },
      story: story.trim(),
      author: { name: 'Você', level: 1, role: 'Contribuição sua' },
      kind: media?.type === 'video' ? 'Vídeo + relato' : 'Foto + relato',
      verified: false,
      status: 'em_revisao',
      media: [
        ...(media ? [{ type: media.type === 'video' ? 'video' : 'photo', uri: media.uri } as const] : []),
        ...(audio ? [{ type: 'audio', uri: audio.uri } as const] : []),
      ],
      audioSeconds: audio?.seconds,
      tags,
      pastImageUri: media?.type === 'image' ? media.uri : undefined,
      presentImageUri: hoje ?? undefined,
    };
    setTimeout(() => {
      adicionarAoAcervo(nova);
      setSending(false);
      setSent(true);
    }, 900);
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
            Ela já está no seu mapa, marcada como <Body style={styles.doneStrong}>em revisão</Body>.
            Passa por uma checagem da comunidade antes de aparecer para as outras pessoas.
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
              <Label
                text="A foto da memória"
                required
                hint="a foto antiga, ou o que você quer registrar"
              />

              {media ? (
                <View>
                  <Image source={{ uri: media.uri }} style={styles.photoFilled} contentFit="cover" />
                  {media.type === 'video' ? (
                    <View style={styles.videoBadge}>
                      <Icon name="play" size={12} color={colors.sobreEsmalte} filled />
                      <Mono style={styles.videoBadgeText}>VÍDEO</Mono>
                    </View>
                  ) : null}
                  <Pressable
                    style={styles.photoSwap}
                    onPress={() => setMedia(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Remover e escolher outra mídia">
                    <Icon name="x" size={15} color="#FFFFFF" strokeWidth={2.2} />
                    <Body style={styles.photoSwapText}>Trocar</Body>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.photobox}>
                  <Icon name="camera" size={28} color={colors.esmalte} strokeWidth={1.8} />
                  <Body style={styles.photoboxHint}>
                    Tem foto de papel? Fotografe ela mesma — vale tanto quanto digitalizar.
                  </Body>
                </View>
              )}

              {/*
                Dois botões explícitos em vez de um menu escondido: a Íris não
                deve precisar descobrir que existe uma escolha atrás do toque.
              */}
              <View style={styles.pickRow}>
                <Pressable
                  style={styles.pickBtn}
                  onPress={() => tirarFoto('memoria')}
                  accessibilityRole="button"
                  accessibilityLabel="Tirar foto ou gravar vídeo agora">
                  <Icon name="camera" size={19} color={colors.sobreEsmalte} strokeWidth={2} />
                  <Body style={styles.pickBtnText}>Tirar foto</Body>
                </Pressable>
                <Pressable
                  style={[styles.pickBtn, styles.pickBtnGhost]}
                  onPress={escolherDaGaleria}
                  accessibilityRole="button"
                  accessibilityLabel="Escolher foto ou vídeo da galeria">
                  <Icon name="image" size={19} color={colors.esmalte} strokeWidth={2} />
                  <Body style={[styles.pickBtnText, { color: colors.esmalte }]}>Da galeria</Body>
                </Pressable>
              </View>

              <Label
                text="Como está hoje"
                hint="opcional — é o que faz o antes↔depois funcionar na ficha"
              />
              {hoje ? (
                <View>
                  <Image source={{ uri: hoje }} style={styles.hojeFoto} contentFit="cover" />
                  <Pressable
                    style={styles.photoSwap}
                    onPress={() => setHoje(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Remover a foto de hoje">
                    <Icon name="x" size={15} color="#FFFFFF" strokeWidth={2.2} />
                    <Body style={styles.photoSwapText}>Trocar</Body>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={[styles.pickBtn, styles.pickBtnGhost]}
                  onPress={() => tirarFoto('hoje')}
                  accessibilityRole="button"
                  accessibilityLabel="Fotografar como o lugar está hoje">
                  <Icon name="camera" size={19} color={colors.esmalte} strokeWidth={2} />
                  <Body style={[styles.pickBtnText, { color: colors.esmalte }]}>
                    Fotografar o lugar hoje
                  </Body>
                </Pressable>
              )}

              <Label text="Áudio" hint="quem viveu contando — vale mais que legenda" />
              <Pressable
                style={[
                  styles.audioBtn,
                  recState.isRecording && styles.audioBtnRec,
                  audio && styles.audioBtnOn,
                ]}
                onPress={gravarAudio}
                accessibilityRole="button"
                accessibilityState={{ selected: !!audio }}
                accessibilityLabel={
                  recState.isRecording
                    ? 'Parar a gravação'
                    : audio
                      ? 'Gravar outro relato por cima'
                      : 'Gravar um relato em áudio'
                }>
                <Icon
                  name={recState.isRecording ? 'pause' : audio ? 'checkCircle' : 'play'}
                  size={20}
                  color={recState.isRecording ? colors.ferrugem : audio ? colors.conferido : colors.esmalte}
                  filled={recState.isRecording}
                />
                <Body style={styles.audioBtnText}>
                  {recState.isRecording
                    ? `Gravando… ${formatSeconds(Math.round(recState.durationMillis / 1000))}`
                    : audio
                      ? `Relato gravado · ${formatSeconds(audio.seconds)}`
                      : 'Gravar um relato'}
                </Body>
                {recState.isRecording ? <View style={styles.recDot} /> : null}
              </Pressable>

              {audio && !recState.isRecording ? (
                <Pressable
                  style={styles.ouvirBtn}
                  onPress={() => {
                    if (playing) {
                      player.pause();
                    } else {
                      player.seekTo(0);
                      player.play();
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={playing ? 'Pausar o relato' : 'Ouvir o relato gravado'}>
                  <Icon
                    name={playing ? 'pause' : 'play'}
                    size={16}
                    color={colors.esmalte}
                    filled
                  />
                  <Body style={styles.ouvirBtnText}>
                    {playing ? 'Tocando…' : 'Ouvir o que você gravou'}
                  </Body>
                </Pressable>
              ) : null}

              {mediaErro ? <Body style={styles.mediaErro}>{mediaErro}</Body> : null}
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
                <MapView
                  ref={locMapRef}
                  provider={PROVIDER_GOOGLE}
                  style={StyleSheet.absoluteFill}
                  customMapStyle={mapStyle}
                  initialRegion={{
                    latitude: alvo.lat,
                    longitude: alvo.lng,
                    latitudeDelta: 0.004,
                    longitudeDelta: 0.004,
                  }}
                  onRegionChangeComplete={(r) =>
                    setLocal({ lat: r.latitude, lng: r.longitude })
                  }
                  showsCompass={false}
                  toolbarEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
                />
                {/*
                  O pino fica cravado no centro e quem se move é o mapa.
                  Arrastar um pino minúsculo com o polegar, em pé na rua, é
                  bem mais difícil do que empurrar o mapa inteiro — Decisão 7,
                  operação com uma mão.
                */}
                <View style={styles.locPin} pointerEvents="none">
                  <Icon name="pinSolid" size={30} color={colors.esmalte} />
                </View>
              </View>

              <View style={styles.locTag}>
                <Mono style={styles.locGps}>AQUI</Mono>
                <Body style={styles.locText} numberOfLines={2}>
                  {endereco ?? 'Procurando o endereço…'}
                </Body>
              </View>

              <Body style={styles.help}>
                Arraste o mapa até o ponto exato. Não precisa ser perfeito — o importante é
                não deixar a memória sem endereço.
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
  hojeFoto: { height: 120, borderRadius: radius.md, marginTop: space.xs },
  videoBadge: {
    position: 'absolute',
    left: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.esmalte,
  },
  videoBadgeText: { fontSize: 9.5, letterSpacing: 1, color: colors.sobreEsmalte },

  pickRow: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  pickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: HIT + 6,
    borderRadius: radius.md,
    backgroundColor: colors.esmalte,
  },
  pickBtnGhost: {
    backgroundColor: colors.cal,
    borderWidth: 1.5,
    borderColor: colors.esmalte,
  },
  pickBtnText: { fontSize: 14, fontWeight: '600', color: colors.sobreEsmalte },

  audioBtnRec: { borderColor: colors.ferrugem, backgroundColor: colors.cal },
  recDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.ferrugem,
  },
  ouvirBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: HIT,
    marginTop: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.calLine,
    backgroundColor: colors.cal2,
  },
  ouvirBtnText: { fontSize: 13.5, fontWeight: '600', color: colors.esmalte },
  mediaErro: { marginTop: space.md, fontSize: 12.5, lineHeight: 18, color: colors.ferrugem },

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
    // mais alto que antes: agora dá pra arrastar de verdade
    height: 230,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.calLine,
  },
  // o pino aponta o centro exato: metade da largura, e a ponta na linha do meio
  locPin: { position: 'absolute', left: '50%', top: '50%', marginLeft: -15, marginTop: -30 },
  locTag: {
    marginTop: space.md,
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
  doneStrong: { fontSize: 14.5, lineHeight: 22, color: colors.esmalte, fontWeight: '600' },
});
