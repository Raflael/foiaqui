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
import { router, useLocalSearchParams } from 'expo-router';
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
import { Body, Mono, Plaque, Story } from '@/components/Type';
import type { Position } from '@/data/location';
import { mapStyle } from '@/data/mapStyle';
import * as VideoThumbnails from 'expo-video-thumbnails';

import { criterios } from '@/data/criterios';
import { rotuloLongo } from '@/data/decadas';
import { pontoPor } from '@/data/pontos';
import { eras, nomeCurto } from '@/data/memories';
import { nivelPor } from '@/data/profile';
import { useImportada } from '@/store/importada';
import { autorDe, usePerfil } from '@/store/perfil';
import { useCurrentPosition } from '@/hooks/useCurrentPosition';
import { useAcervo } from '@/store/acervo';
import { tituloDoRascunho, useGaveta, type RascunhoGuardado } from '@/store/gaveta';
import { temConteudo, useRascunho } from '@/store/rascunho';
import { colors, fonts, HIT, radius, space } from '@/theme';
import type { Memory } from '@/types';

const TAGS = ['Cinema', 'Lazer', 'Centro', 'Demolido', 'Família', 'Arte urbana', 'Escola'];

const STEPS = ['Mídia', 'História', 'Local', 'Época'] as const;

/**
 * As perguntas do modo entrevista.
 *
 * O lado que CRIA é o mais difícil do produto, e o pior momento dele é a tela
 * em branco: a pessoa tem a memória inteira na cabeça e não sabe por onde
 * entrar. Pergunta concreta e sensorial destrava — é técnica de historiador
 * oral, não invenção: ninguém responde "o que aconteceu aqui?", todo mundo
 * responde "que cheiro tinha?".
 *
 * Nenhuma delas escreve nada pela pessoa. A pergunta é isca, não modelo.
 */
/**
 * Âncoras de época: marcos que quase todo mundo em São José consegue datar.
 *
 * Ninguém lembra "1983". Todo mundo lembra "foi na época da enchente". A
 * Decisão 3 torna a data obrigatória porque é ela que viabiliza linha do
 * tempo, sobreposição e coleções — mas obrigatoriedade sem ferramenta vira
 * chute, e chute registrado como data é dado falso no acervo.
 *
 * As âncoras são fatos verificáveis do próprio acervo semeado ou da história
 * pública da cidade, não efemérides genéricas: "quando a Parahyba abriu"
 * ancora quem trabalhou lá, e isso um calendário nacional não faz.
 */
const ANCORAS: { rotulo: string; ano: number }[] = [
  { rotulo: 'Quando o Mercado abriu', ano: 1923 },
  { rotulo: 'Quando a Tecelagem Parahyba abriu', ano: 1925 },
  { rotulo: 'Quando o sanatório funcionava', ano: 1940 },
  { rotulo: 'Quando a Dutra ficou pronta', ano: 1951 },
  { rotulo: 'Quando o homem foi à Lua', ano: 1969 },
  { rotulo: 'Na época da enchente grande', ano: 1983 },
  { rotulo: 'Quando o Plano Real chegou', ano: 1994 },
  { rotulo: 'Na virada do milênio', ano: 2000 },
];

const PERGUNTAS = [
  'Quem te levou lá pela primeira vez?',
  'Que barulho tinha? E que cheiro?',
  'O que vendiam, e quanto custava?',
  'Quem trabalhava lá? Você lembra de algum nome?',
  'O que você vestia quando ia?',
  'O que mudou no dia em que fechou?',
  'Quem mais lembra disso com você?',
  'Se as paredes falassem, qual seria a primeira fofoca?',
  'O que você fazia lá que hoje não se faz mais?',
  'Qual era o caminho até lá — e por onde não se podia ir?',
] as const;

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

  // o que estava salvo entra como estado inicial: a pessoa volta onde parou
  const guardado = useRascunho.getState();
  const [recuperado] = useState(() => temConteudo(guardado));

  const [step, setStep] = useState(guardado.step);
  const [media, setMedia] = useState<{ uri: string; type: 'image' | 'video' } | null>(
    guardado.media,
  );
  /** A vista de hoje, opcional — é ela que faz o antes↔depois existir. */
  const [hoje, setHoje] = useState<string | null>(guardado.hoje);
  const [audio, setAudio] = useState<{ uri: string; seconds: number } | null>(guardado.audio);
  const [mediaErro, setMediaErro] = useState<string | null>(null);

  // gera a miniatura quando entra um vídeo; limpa quando entra foto
  useEffect(() => {
    let vivo = true;
    if (media?.type !== 'video') {
      setCapaVideo(null);
      return;
    }
    VideoThumbnails.getThumbnailAsync(media.uri, { time: 1000 })
      .then((r) => {
        if (vivo) setCapaVideo(r.uri);
      })
      // miniatura é conveniência: se o codec não deixar, o passo segue sem ela
      .catch(() => {
        if (vivo) setCapaVideo(null);
      });
    return () => {
      vivo = false;
    };
  }, [media]);

  const { position, source } = useCurrentPosition();
  const adicionarAoAcervo = useAcervo((s) => s.adicionar);
  const locMapRef = useRef<MapView>(null);
  /**
   * Chegando de "Contar a minha aqui": o lugar já vem escolhido.
   *
   * É o que faz o ponto virar feed de verdade — sem isso, quem quisesse somar
   * uma história ao Mercado Municipal teria de encontrar o mesmo endereço no
   * mapa de novo, na mão, e provavelmente erraria por alguns metros: nasceria
   * um pin novo ao lado em vez de mais uma história no mesmo lugar.
   */
  const { ponto: pontoParam } = useLocalSearchParams<{ ponto?: string }>();
  const pontoDeOrigem = pontoPor(pontoParam);

  const [local, setLocal] = useState<Position | null>(
    pontoDeOrigem ? { lat: pontoDeOrigem.coords.lat, lng: pontoDeOrigem.coords.lng } : guardado.local,
  );
  const [endereco, setEndereco] = useState<string | null>(pontoDeOrigem?.endereco ?? null);
  // o local nasce onde a pessoa está; ela ajusta se a memória for logo ali adiante
  const alvo = local ?? position;

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);
  // ouvir o próprio relato antes de enviar: sem isto a pessoa grava no escuro
  const player = useAudioPlayer(audioSource(audio?.uri));
  const playing = useAudioPlayerStatus(player).playing;
  const [story, setStory] = useState(guardado.story);
  // modo entrevista: qual pergunta está servindo de isca agora
  const [pergunta, setPergunta] = useState(0);
  /** de quem é a memória, quando quem digita é outra pessoa */
  const [contadaPor, setContadaPor] = useState('');

  /** zera o formulário inteiro — usado pelo "começar de novo" e pela gaveta */
  const zerar = () => {
    useRascunho.getState().limpar();
    setStep(0);
    setMedia(null);
    setHoje(null);
    setAudio(null);
    setStory('');
    setEra(null);
    setAno('');
    setTags([]);
    setLocal(null);
    setContadaPor('');
    setCreditoImportado(null);
  };

  /** traz um rascunho da gaveta de volta para o formulário */
  const retomar = (r: RascunhoGuardado) => {
    setStep(r.step);
    setMedia(r.media);
    setHoje(r.hoje);
    setAudio(r.audio);
    setStory(r.story);
    setEra(r.era);
    setAno(r.ano ?? '');
    setTags(r.tags);
    setLocal(r.local);
    descartarDaGaveta(r.id);
  };

  // a gaveta: outras memórias começadas e ainda não enviadas
  const naGaveta = useGaveta((s) => s.rascunhos);
  const guardarNaGaveta = useGaveta((s) => s.guardar);
  const descartarDaGaveta = useGaveta((s) => s.descartar);

  /**
   * A miniatura do vídeo escolhido.
   *
   * Sem ela o passo da mídia mostra um retângulo preto e a pessoa não tem
   * como saber se gravou o que queria — ela precisaria publicar para
   * descobrir. Um quadro do primeiro segundo responde na hora.
   */
  const [capaVideo, setCapaVideo] = useState<string | null>(null);
  /** crédito da foto vinda do acervo livre, quando houver */
  const [creditoImportado, setCreditoImportado] = useState<string | null>(null);

  // recebe a escolha feita na tela do acervo livre
  const importada = useImportada((s) => s.escolhida);
  const limparImportada = useImportada((s) => s.limpar);
  useEffect(() => {
    if (!importada) return;
    setMedia({ uri: importada.uri, type: 'image' });
    setCreditoImportado(importada.credito);
    limparImportada();
  }, [importada, limparImportada]);
  const [era, setEra] = useState<string | null>(guardado.era);
  /** Ano exato, quando a pessoa sabe. Vazio significa "só a década". */
  const [ano, setAno] = useState(guardado.ano ?? '');
  const [tags, setTags] = useState<string[]>(guardado.tags);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const toggleTag = (tag: string) =>
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));

  // o local nasce preenchido pelo GPS, então este passo já nasce válido
  const canContinue = [media !== null, story.trim().length >= 10, true, era !== null][step];
  const isLast = step === STEPS.length - 1;

  /** Entre a fotografia existir e hoje. Fora disso é engano de digitação. */
  const anoValido = /^d{4}$/.test(ano) && +ano >= 1830 && +ano <= new Date().getFullYear();

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
      // a duração vem do PRÓPRIO gravador, antes de parar: o estado pesquisado
      // a cada 500 ms já pode ter zerado, e aí a memória nascia sem áudio
      const segundos = Math.max(1, Math.round(recorder.currentTime));
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        setMediaErro('Não consegui salvar o áudio. Tente gravar de novo.');
        return;
      }
      setAudio({ uri, seconds: segundos });
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

  // grava a cada mudança: fechar o app no meio não pode custar o relato
  useEffect(() => {
    useRascunho.getState().salvar({ step, media, hoje, audio, story, era, ano, tags, local });
  }, [step, media, hoje, audio, story, era, ano, tags, local]);

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
    /*
     * Identificar-se é exigido AQUI, não na porta do app (Decisão 1): a
     * autoria só passa a importar quando algo vai ser publicado com um nome.
     * O rascunho já está salvo, então ir e voltar não custa nada a quem
     * escreveu.
     */
    if (!usePerfil.getState().nome) {
      router.push({ pathname: '/entrar', params: { motivo: 'criar' } });
      return;
    }
    setSending(true);
    const agora = new Date();
    const nova: Memory = {
      id: `local-${agora.getTime()}`,
      title: tituloDoRelato(story),
      shortName: pontoDeOrigem?.shortName ?? nomeCurto(endereco),
      // o tempo verbal conta se a coisa sobreviveu: presente para o que ainda está lá
      marker: era === 'Atual' || (anoValido && +ano >= new Date().getFullYear() - 1)
        ? 'Aqui está'
        : 'Aqui foi',
      period: anoValido ? ano : (era ?? String(agora.getFullYear())),
      year: anoValido
        ? ano
        : era === 'Atual'
          ? String(agora.getFullYear())
          : (ANO_DA_ERA[era ?? ''] ?? '—'),
      era: era ?? 'Atual',
      pontoId: pontoDeOrigem?.id,
      place: endereco ?? 'Local marcado no mapa',
      coords: { lat: alvo.lat, lng: alvo.lng },
      story: story.trim(),
      author: {
        name: autorDe(usePerfil.getState().nome),
        level: nivelPor(useAcervo.getState().criadas.length + 1).nivel,
        role: nivelPor(useAcervo.getState().criadas.length + 1).titulo,
      },
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
      // o crédito acompanha a foto quando ela veio do acervo livre: é o que
      // as licenças CC exigem em troca do uso
      creditoFoto: creditoImportado ?? undefined,
      contadaPor: contadaPor.trim() || undefined,
      presentImageUri: hoje ?? undefined,
    };
    setTimeout(() => {
      adicionarAoAcervo(nova);
      useRascunho.getState().limpar();
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

        {recuperado ? (
          <View style={styles.recuperado}>
            <Icon name="clock" size={15} color={colors.esmalte} strokeWidth={2.2} />
            <Body style={styles.recuperadoText}>Continuando de onde você parou</Body>
            <Pressable
              onPress={() => {
                guardarNaGaveta(useRascunho.getState(), tituloDoRascunho(useRascunho.getState()));
                zerar();
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Guardar este rascunho na gaveta e começar outra memória">
              <Body style={styles.recuperadoLink}>Guardar e começar outra</Body>
            </Pressable>
            <Pressable
              onPress={zerar}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Descartar o rascunho e começar de novo">
              <Body style={styles.recuperadoLink}>Começar de novo</Body>
            </Pressable>
          </View>
        ) : null}

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
                  {/*
                    Vídeo mostra a miniatura, não o próprio arquivo: <Image>
                    apontando para um .mp4 desenha um retângulo preto, e a
                    pessoa fica sem saber se gravou o que queria.
                  */}
                  <Image
                    source={{ uri: media.type === 'video' ? (capaVideo ?? media.uri) : media.uri }}
                    style={styles.photoFilled}
                    contentFit="cover"
                  />
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

              {/*
                A terceira via, para quem não tem foto: o que já está
                catalogado e licenciado perto do lugar. É a resposta mais
                barata ao mapa vazio — o acervo do mundo já fotografou muita
                coisa que ninguém contou ainda.
              */}
              <Pressable
                style={styles.acervoLivre}
                onPress={() =>
                  router.push({
                    pathname: '/acervo-livre',
                    params: local
                      ? { lat: String(local.lat), lng: String(local.lng) }
                      : undefined,
                  })
                }
                accessibilityRole="button"
                accessibilityLabel="Procurar fotos com licença livre perto deste lugar">
                <Icon name="search" size={17} color={colors.esmalte} strokeWidth={2.1} />
                <View style={{ flex: 1 }}>
                  <Body style={styles.acervoLivreTitulo}>Não tem foto?</Body>
                  <Body style={styles.acervoLivreNota}>
                    Procurar no acervo livre do Wikimedia perto daqui
                  </Body>
                </View>
                <Icon name="chevronRight" size={16} color={colors.grafiteDim} />
              </Pressable>

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

              {/*
                Quem viveu nem sempre é quem digita. Sem este campo o app
                rouba a autoria de quem lembra e entrega a quem transcreveu.
              */}
              <Label text="De quem é esta memória?" />
              <TextInput
                style={styles.campoCurto}
                value={contadaPor}
                onChangeText={setContadaPor}
                placeholder="Minha avó, Dona Cecília — vazio se for sua"
                placeholderTextColor="#A89A82"
                maxLength={60}
                accessibilityLabel="De quem é esta memória, se não for sua"
              />

              {/*
                O modo entrevista: uma pergunta concreta como isca para quem
                congela na tela em branco. Ela não escreve nada pela pessoa —
                só muda a pergunta na cabeça de "o que eu escrevo?" para
                "quem me levou lá?", que qualquer um responde.
              */}
              <View style={styles.entrevista}>
                <Body style={styles.entrevistaTitulo}>Travou? Responda só isto:</Body>
                <Story style={styles.entrevistaPergunta}>
                  {PERGUNTAS[pergunta % PERGUNTAS.length]}
                </Story>
                <Pressable
                  style={styles.entrevistaOutra}
                  onPress={() => setPergunta((p) => p + 1)}
                  accessibilityRole="button"
                  accessibilityLabel="Fazer outra pergunta">
                  <Icon name="sparkle" size={14} color={colors.ferrugem} strokeWidth={2.2} />
                  <Body style={styles.entrevistaOutraText}>Outra pergunta</Body>
                </Pressable>
              </View>
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
              {/*
                Para quem não lembra o número mas lembra do que aconteceu
                junto. A âncora preenche o ano — e continua editável, porque
                ela é ponto de partida, não veredito.
              */}
              <View style={styles.ancoras}>
                <Body style={styles.ancorasTitulo}>Não lembra o ano?</Body>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.ancorasLinha}>
                  {ANCORAS.map((a) => (
                    <Pressable
                      key={a.rotulo}
                      style={styles.ancora}
                      onPress={() => {
                        setAno(String(a.ano));
                        setEra(rotuloLongo(Math.floor(a.ano / 10) * 10));
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${a.rotulo}: preencher o ano ${a.ano}`}>
                      <Body style={styles.ancoraText}>{a.rotulo}</Body>
                      <Mono style={styles.ancoraAno}>{a.ano}</Mono>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

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

              <Label
                text="Sabe o ano?"
                hint="opcional — se souber, é ele que vai na placa"
              />
              <View style={styles.anoLinha}>
                <TextInput
                  style={styles.anoInput}
                  value={ano}
                  onChangeText={(t) => setAno(t.replace(/[^0-9]/g, '').slice(0, 4))}
                  placeholder="1958"
                  placeholderTextColor={colors.grafiteDim}
                  keyboardType="number-pad"
                  maxLength={4}
                  accessibilityLabel="Ano exato da memória, se você souber"
                />
                <Body style={styles.anoAjuda}>
                  {anoValido
                    ? `A placa vai dizer ${ano}.`
                    : ano.length > 0
                      ? 'Ano fora do intervalo — vai valer só a década.'
                      : `Sem isso, a placa diz "${era ?? 'a década escolhida'}".`}
                </Body>
              </View>

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

              {/*
                A mesma régua que o revisor vai usar, mostrada ANTES de enviar.
                Critério que só aparece na recusa é armadilha: a pessoa gastou o
                trabalho de escrever para descobrir a regra depois (Decisão 5).
              */}
              <View style={styles.modNote}>
                <View style={styles.modNoteTopo}>
                  <Icon name="shieldCheck" size={16} color={colors.conferido} />
                  <Body style={styles.modNoteText}>
                    A comunidade confere antes de publicar. É isto que vão olhar:
                  </Body>
                </View>
                {criterios.map((c) => (
                  <View key={c.id} style={styles.modCriterio}>
                    <Icon name={c.icon} size={13} color={colors.esmalte} strokeWidth={2.1} />
                    <Body style={styles.modCriterioText}>{c.pergunta}</Body>
                  </View>
                ))}
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

  recuperado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginHorizontal: 22,
    marginTop: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.cal2,
    borderWidth: 1,
    borderColor: colors.calLine,
  },
  recuperadoText: { flex: 1, fontSize: 12.5, color: colors.grafiteDim },
  recuperadoLink: { fontSize: 12.5, fontWeight: '600', color: colors.esmalte },

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
  acervoLivre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.calLine,
    backgroundColor: colors.cal2,
    minHeight: HIT,
  },
  acervoLivreTitulo: { fontSize: 13.5, fontWeight: '600', color: colors.esmalte },
  acervoLivreNota: { fontSize: 11.5, lineHeight: 16, color: colors.grafiteDim, marginTop: 2 },

  ancoras: { marginBottom: space.lg, gap: 6 },
  ancorasTitulo: { fontSize: 12.5, color: colors.grafiteDim },
  ancorasLinha: { gap: space.sm, paddingRight: space.lg },
  ancora: {
    minHeight: HIT,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderColor: colors.calLine,
    backgroundColor: colors.cal2,
  },
  ancoraText: { fontSize: 12.5, color: colors.grafite },
  ancoraAno: { fontSize: 11, color: colors.ferrugem, marginTop: 1 },

  campoCurto: {
    minHeight: HIT + 4,
    marginTop: 6,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderColor: colors.calLine,
    backgroundColor: colors.cal2,
    color: colors.grafite,
    fontSize: 15.5,
  },

  entrevista: {
    marginTop: space.lg,
    padding: space.lg,
    backgroundColor: colors.cal2,
    borderLeftWidth: 3,
    borderLeftColor: colors.ferrugem,
    gap: 6,
  },
  entrevistaTitulo: { fontSize: 12, color: colors.grafiteDim },
  // Newsreader: é pergunta de gente para gente, não rótulo de interface
  entrevistaPergunta: { fontSize: 18, lineHeight: 24, color: colors.grafite },
  entrevistaOutra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: HIT - 8,
    alignSelf: 'flex-start',
    paddingRight: space.md,
  },
  entrevistaOutraText: { fontSize: 13.5, fontWeight: '600', color: colors.ferrugem },

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

  anoLinha: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  anoInput: {
    width: 92,
    minHeight: HIT,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.calLine,
    backgroundColor: colors.cal2,
    fontFamily: fonts.mono.regular,
    fontSize: 17,
    letterSpacing: 1,
    color: colors.grafite,
  },
  anoAjuda: { flex: 1, fontSize: 12, lineHeight: 17, color: colors.grafiteDim },

  chipRow: { gap: space.sm, paddingRight: space.xl },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },

  modNote: {
    marginTop: space.xxl,
    padding: space.lg,
    backgroundColor: colors.cal2,
    borderLeftWidth: 3,
    borderLeftColor: colors.conferido,
    gap: space.sm,
  },
  modNoteTopo: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  modNoteText: { flex: 1, fontSize: 12.5, lineHeight: 17.5, color: colors.grafiteDim },
  modCriterio: { flexDirection: 'row', gap: 9, alignItems: 'center', minHeight: 20 },
  modCriterioText: { flex: 1, fontSize: 12.5, color: colors.grafite },

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
