import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Sharing from 'expo-sharing';
import * as Speech from 'expo-speech';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Linking,
  Pressable,
  Share,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { captureRef } from 'react-native-view-shot';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { MemoryCard } from '@/components/MemoryCard';
import { Plaque as PlaquePlate } from '@/components/Plaque';
import { Lupa } from '@/components/Lupa';
import { RevealSlider } from '@/components/RevealSlider';
import { router } from 'expo-router';

import { anoDe, rotuloLongo } from '@/data/decadas';
import { fonteDaImagem } from '@/data/imagens';
import { useLinhaDoTempo } from '@/store/linhaDoTempo';
import { Body, Mono, Plaque, Story } from '@/components/Type';
import { distanceMeters, formatDistance } from '@/data/location';
import { memories as seed } from '@/data/memories';
import { useCurrentPosition } from '@/hooks/useCurrentPosition';
import { useMotionEnabled } from '@/hooks/useMotion';
import { useAcervo, useMemoria } from '@/store/acervo';
import { useSaved } from '@/store/saved';
import { useSheet, type Snap } from '@/store/sheet';
import { alpha, colors, HIT, radius, space } from '@/theme';
import type { Memory } from '@/types';

/** Alturas da forma de onda, em % — as mesmas do protótipo. */
const WAVE = [40, 70, 100, 55, 85, 45, 75, 60, 95, 50, 70, 40];

const formatDuration = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const SPRING = { damping: 22, stiffness: 200 } as const;

/**
 * A ficha de memória, como bottom sheet sobre o mapa (Decisão 2 da pesquisa).
 *
 * Vive na raiz do app, acima das abas, para funcionar de qualquer tela —
 * mapa, salvos ou trilhas — sem empilhar navegação. Três alturas:
 *
 *   espiada  — só o cabeçalho: época, título e endereço
 *   meio     — leitura confortável com o mapa ainda visível em cima
 *   cheia    — a memória inteira
 *
 * O arraste fica no cabeçalho, e não na folha toda, porque o corpo tem dois
 * gestos concorrentes: o scroll vertical e o arraste horizontal do slider
 * passado↔presente. Separar as áreas evita que um roube o outro.
 */
export function MemorySheet() {
  const { height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const motion = useMotionEnabled();

  const openId = useSheet((s) => s.openId);
  const snap = useSheet((s) => s.snap);
  const setSnap = useSheet((s) => s.setSnap);
  const close = useSheet((s) => s.close);
  const swap = useSheet((s) => s.swap);

  /*
   * Este hook precisa ficar aqui em cima, junto dos outros.
   *
   * Ele estava depois do `if (!shown || hidden) return null`, e isso derrubava
   * o app: com a folha fechada o React conta N hooks, ao abrir uma memória
   * conta N+1, e a regra dos hooks quebra. O erro aparecia como crash em
   * "Rendered more hooks than during the previous render" — só que em release,
   * porque o Fast Refresh do desenvolvimento remonta o componente a cada
   * edição e mascarava a diferença de contagem.
   */
  const escolherDecada = useLinhaDoTempo((s) => s.escolher);
  // para o "como chegar": só mostramos distância quando a posição é real
  const { position, denied } = useCurrentPosition();

  /**
   * O app lendo o relato em voz alta.
   *
   * Não é o mesmo que o chip de áudio, e a interface precisa dizer isso: o
   * áudio é A VOZ DE QUEM VIVEU, gravada; isto é a máquina lendo o texto. Um
   * é acervo, o outro é acessibilidade — confundir os dois desvalorizaria o
   * primeiro, que é o coração do produto.
   *
   * Existe porque a persona principal tem 70 anos e o contexto é sol na tela
   * (Decisão 7): ler parágrafo em pé, na rua, com a vista cansada, é a
   * barreira que nenhum tamanho de fonte resolve sozinho.
   */
  const [lendo, setLendo] = useState(false);

  /**
   * A placa como imagem, para compartilhar.
   *
   * Cada memória compartilhada é o melhor anúncio que o produto tem — e um
   * bloco de texto no WhatsApp não mostra que isto é uma PLACA. A imagem
   * mostra, e leva o nome do app junto.
   *
   * O cartão é renderizado fora da tela em vez de fotografar a chapa visível:
   * a chapa na ficha tem a largura do celular de quem compartilha e pode
   * estar parcialmente rolada para fora. O cartão dedicado tem proporção
   * fixa, sempre inteiro, e cabe a assinatura no rodapé.
   */
  const cartao = useRef<View>(null);
  const [gerando, setGerando] = useState(false);

  /** qual foto está aberta em tela cheia (null = nenhuma) */
  const [lupa, setLupa] = useState<{ fonte: string | number; legenda: string } | null>(null);

  // parar de falar ao trocar de memória ou fechar — senão a voz continua
  // narrando um texto que não está mais na tela
  useEffect(() => {
    Speech.stop();
    setLendo(false);
  }, [openId]);

  const savedIds = useSaved((s) => s.ids);
  const toggleSaved = useSaved((s) => s.toggle);
  const criadas = useAcervo((s) => s.criadas);

  // Segura a última memória durante a animação de saída, senão a folha
  // esvazia no meio do movimento.
  const encontrada = useMemoria(openId);
  const [shown, setShown] = useState<Memory | null>(null);
  useEffect(() => {
    if (encontrada) setShown(encontrada);
  }, [encontrada]);

  const [headerH, setHeaderH] = useState(200);

  /**
   * O áudio das memórias semente é fictício — o campo existe para o protótipo
   * mostrar o componente, mas não há arquivo. O que a pessoa grava, sim, toca.
   * Em vez de fingir que toca e não tocar, o app diz qual é qual.
   */
  const audioUri = shown?.media.find((m) => m.type === 'audio')?.uri;
  const tocavel = !!audioUri && /^(file|content|https?):/.test(audioUri);
  const player = useAudioPlayer(tocavel ? { uri: audioUri } : null);
  const playing = useAudioPlayerStatus(player).playing;

  /**
   * O vídeo que a pessoa gravou, finalmente tocável.
   *
   * Até aqui o formulário gravava o vídeo, a ficha dizia "Vídeo + relato" — e
   * não havia player nenhum. A mídia ficava em `media`, inreproduzível: a
   * ficha só olhava os campos de foto. Prometer vídeo e não tocar é a mesma
   * mentira de interface do áudio que não tocava.
   *
   * Sem autoplay, de propósito: o contexto é a rua, com dados móveis, e os
   * controles nativos exigem o toque — que também é o caminho acessível.
   * O hook fica AQUI, junto dos outros: hook depois do retorno antecipado foi
   * exatamente o bug que derrubava o APK.
   */
  const videoUri = shown?.media.find((m) => m.type === 'video')?.uri ?? null;
  const videoPlayer = useVideoPlayer(videoUri);
  // Fora de cena de verdade: enquanto `hidden` for true a folha nem é montada.
  const [hidden, setHidden] = useState(true);
  const scroller = useRef<ScrollView>(null);

  const peekTop = Math.max(H - (headerH + insets.bottom + space.sm), H * 0.5);
  const tops = { full: H * 0.08, mid: H * 0.46, peek: peekTop };

  /**
   * Onde a folha estaciona quando fechada.
   *
   * Não basta `H`: no Android `useWindowDimensions` devolve a altura da JANELA,
   * que exclui a barra de navegação. Deslocar exatamente `H` deixava uma tira
   * de papel visível por cima da tab bar. Daí a folga.
   */
  const CLOSED = H + insets.bottom + 160;

  const y = useSharedValue(CLOSED);
  const startY = useSharedValue(0);

  useEffect(() => {
    if (openId) {
      if (hidden) {
        y.value = CLOSED; // ponto de partida da entrada
        setHidden(false);
      }
      const target = tops[snap];
      y.value = motion ? withSpring(target, SPRING) : target;
    } else if (!hidden) {
      if (motion) {
        y.value = withTiming(CLOSED, { duration: 220 }, (finished) => {
          if (finished) runOnJS(setHidden)(true);
        });
      } else {
        y.value = CLOSED;
        setHidden(true);
      }
    }
    // tops deriva de H/headerH/insets, já cobertos pelas dependências
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, snap, H, headerH, insets.bottom, motion, hidden, CLOSED]);

  // Sem isso, o botão voltar do Android fecha o app com a ficha aberta.
  useEffect(() => {
    if (!openId) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [openId, close]);

  useEffect(() => {
    scroller.current?.scrollTo({ y: 0, animated: false });
  }, [openId]);

  const pan = Gesture.Pan()
    .onStart(() => {
      startY.value = y.value;
    })
    .onUpdate((e) => {
      y.value = Math.min(Math.max(startY.value + e.translationY, tops.full), H);
    })
    .onEnd((e) => {
      // projeta onde o dedo "ia parar" para que um flick decida o destino
      const projected = y.value + e.velocityY * 0.12;

      if (projected > tops.peek + H * 0.09) {
        runOnJS(close)();
        return;
      }

      const options: { name: Snap; top: number }[] = [
        { name: 'full', top: tops.full },
        { name: 'mid', top: tops.mid },
        { name: 'peek', top: tops.peek },
      ];
      let best = options[0];
      for (const o of options) {
        if (Math.abs(projected - o.top) < Math.abs(projected - best.top)) best = o;
      }
      y.value = withSpring(best.top, SPRING);
      runOnJS(setSnap)(best.name);
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [tops.full, tops.peek], [0.55, 0], Extrapolation.CLAMP),
  }));

  /** Passos para quem opera por leitor de tela e não consegue arrastar. */
  const step = (dir: 1 | -1) => {
    const order: Snap[] = ['peek', 'mid', 'full'];
    const next = order[Math.min(Math.max(order.indexOf(snap) + dir, 0), order.length - 1)];
    setSnap(next);
  };

  if (!shown || hidden) return null;

  const saved = savedIds.includes(shown.id);
  /**
   * "Deste local" precisa significar alguma coisa: ordena pela distância até
   * a memória aberta e mostra quanto é. Antes vinha na ordem do arquivo, o
   * que fazia o título mentir.
   */
  const acervo = [...criadas, ...seed].filter((m) => m.id !== shown.id);
  const textoDeCompartilhar =
    `${shown.marker.toUpperCase()}: ${shown.title} — ${shown.place}, ${shown.period}.

` +
    `${shown.story.slice(0, 180)}${shown.story.length > 180 ? '…' : ''}

` +
    `Veja no FoiAqui: foiaqui://m/${shown.id}`;

  const compartilhar = async () => {
    if (gerando) return;
    setGerando(true);
    try {
      const podeArquivo = await Sharing.isAvailableAsync();
      if (podeArquivo && cartao.current) {
        const uri = await captureRef(cartao, { format: 'png', quality: 0.96 });
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Compartilhar esta memória',
        });
      } else {
        // sem compartilhamento de arquivo, o texto ainda leva o link
        await Share.share({ message: textoDeCompartilhar });
      }
    } catch {
      // se a captura falhar, o texto é sempre melhor que nada acontecer
      await Share.share({ message: textoDeCompartilhar }).catch(() => {});
    } finally {
      setGerando(false);
    }
  };

  /** o próximo capítulo desta história, quando existe */
  const continuacao = shown.continuaEm
    ? acervo.find((m) => m.id === shown.continuaEm)
    : undefined;

  /**
   * O feed do lugar.
   *
   * "Deste local" por proximidade era aproximação: duas memórias a 40 m são de
   * lugares diferentes, e duas do mesmo endereço podem ter coordenada
   * ligeiramente distinta. Com `pontoId` a pergunta passa a ter resposta
   * exata — estas são as outras histórias DESTE lugar, na ordem do tempo, que
   * é como um lugar se conta.
   */
  const doPonto = shown.pontoId
    ? acervo.filter((m) => m.pontoId === shown.pontoId).sort((a, b) => (a.year > b.year ? 1 : -1))
    : [];
  const idsDoPonto = new Set(doPonto.map((m) => m.id));
  const others = acervo
    .filter((m) => !idsDoPonto.has(m.id))
    .map((m) => ({ m, metros: distanceMeters(shown.coords, m.coords) }))
    .sort((a, b) => a.metros - b.metros);
  const anoDaMemoria = anoDe(shown);
  const decadaDaMemoria = anoDaMemoria !== null ? Math.floor(anoDaMemoria / 10) * 10 : null;
  // ou as duas fotos existem, ou nenhuma (e aí as duas cenas são desenhadas)
  const comparavel = !!shown.pastImageUri === !!shown.presentImageUri;
  const isOpen = openId !== null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? 'box-none' : 'none'}>
      <Lupa
        fonte={lupa?.fonte}
        legenda={lupa?.legenda}
        aberta={!!lupa}
        onFechar={() => setLupa(null)}
      />

      {/*
        O cartão de compartilhar, renderizado fora da tela.
        Proporção fixa e a assinatura no rodapé — é isto que vai para o
        WhatsApp, não uma foto da folha de quem compartilhou.
      */}
      <View style={styles.forasDeCena} pointerEvents="none" collapsable={false}>
        <View ref={cartao} collapsable={false} style={styles.cartao}>
          <View style={styles.cartaoMoldura}>
            <Body style={styles.cartaoMarker}>{shown.marker.toUpperCase()}</Body>
            <Plaque style={styles.cartaoTitulo}>{shown.title}</Plaque>
            <View style={styles.cartaoRegua} />
            <Mono style={styles.cartaoPeriodo}>{shown.period}</Mono>
            <Plaque weight="semibold" style={styles.cartaoLugar}>
              {shown.place}
            </Plaque>
          </View>
          <View style={styles.cartaoLasca} />
          <View style={styles.cartaoPe}>
            <Plaque style={styles.cartaoApp}>Foi Aqui</Plaque>
            <Mono style={styles.cartaoAssinatura}>memória urbana · {shown.author.name}</Mono>
          </View>
        </View>
      </View>

      {isOpen && snap !== 'peek' ? (
        <Animated.View style={[styles.scrim, scrimStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Fechar a memória e voltar ao mapa"
          />
        </Animated.View>
      ) : null}

      <Animated.View
        style={[styles.sheet, { height: H }, sheetStyle]}
        pointerEvents={isOpen ? 'auto' : 'none'}>
        <GestureDetector gesture={pan}>
          <View onLayout={(e: LayoutChangeEvent) => setHeaderH(e.nativeEvent.layout.height)}>
            <View
              style={styles.grabberZone}
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel={`Ficha de ${shown.title}`}
              accessibilityHint="Deslize para cima para ler a memória inteira, para baixo para ver o mapa"
              accessibilityValue={{ text: { peek: 'espiada', mid: 'meio', full: 'aberta' }[snap] }}
              accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
              onAccessibilityAction={(e) => {
                if (e.nativeEvent.actionName === 'increment') step(1);
                if (e.nativeEvent.actionName === 'decrement') step(-1);
              }}>
              <View style={styles.grabber} />
            </View>

            <View style={styles.tools}>
              <Mono style={styles.kind}>{shown.kind.toUpperCase()}</Mono>
              <View style={styles.headActions}>
                <RoundBtn
                  icon="bookmark"
                  label={saved ? 'Remover dos salvos' : 'Salvar memória'}
                  active={saved}
                  onPress={() => toggleSaved(shown.id)}
                />
                <RoundBtn icon="x" label="Fechar" onPress={close} />
              </View>
            </View>

            {/*
              O cabeçalho É a placa. A ordem é a da placa comemorativa real:
              o que aconteceu, o nome, o período, o endereço.
            */}
            <PlaquePlate chipped style={styles.plate}>
              <View style={styles.plateInner}>
                <Plaque weight="semibold" style={styles.marker}>
                  {shown.marker}
                </Plaque>
                <Plaque style={styles.title}>{shown.title}</Plaque>
                <View style={styles.periodRow}>
                  <Mono style={styles.period}>{shown.period}</Mono>
                  <View style={styles.rule} />
                </View>
                <Plaque weight="semibold" style={styles.address}>
                  {shown.place}
                </Plaque>
                {shown.status === 'em_revisao' ? (
                  <View style={styles.revisao}>
                    <Icon name="clock" size={13} color={colors.esmalte} strokeWidth={2.2} />
                    <Body style={styles.revisaoText}>
                      Em revisão pela comunidade — só você vê por enquanto
                    </Body>
                  </View>
                ) : null}
              </View>
            </PlaquePlate>
          </View>
        </GestureDetector>

        <ScrollView
          ref={scroller}
          scrollEnabled={snap !== 'peek'}
          contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }}
          showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            {videoUri ? (
              /* o vídeo é a mídia que a pessoa escolheu: quando existe, é o herói */
              <VideoView
                player={videoPlayer}
                style={{ height: 240 }}
                contentFit="cover"
                nativeControls
              />
            ) : comparavel ? (
              <RevealSlider
                pastLabel={shown.year}
                pastUri={shown.pastImageUri}
                presentUri={shown.presentImageUri}
                height={240}
              />
            ) : (
              /*
                Uma foto só não é comparação. Mostrar o divisor aqui faria a
                pessoa arrastar esperando ver o "depois" e encontrar um desenho
                — pior que não ter o gesto.
              */
              <Pressable
                style={{ height: 240 }}
                onPress={() => {
                  const f = shown.pastImageUri ?? shown.presentImageUri;
                  if (f !== undefined) {
                    setLupa({ fonte: f, legenda: shown.pastImageUri ? shown.year : 'Hoje' });
                  }
                }}
                accessibilityRole="imagebutton"
                accessibilityLabel={`Foto de ${shown.title}. Tocar para ver grande.`}>
                <Image
                  source={fonteDaImagem(shown.pastImageUri ?? shown.presentImageUri)}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
                <View style={styles.soloCap}>
                  <Mono style={styles.soloCapText}>
                    {shown.pastImageUri ? shown.year : 'HOJE'}
                  </Mono>
                </View>
                <View style={styles.ampliar}>
                  <Icon name="search" size={13} color={colors.sobreEsmalte} strokeWidth={2.2} />
                </View>
              </Pressable>
            )}
          </View>

          {/*
            As duas fotos da comparação também abrem grandes. O slider mostra
            o que mudou; a lupa mostra o que TEM — o rosto na porta da loja, o
            letreiro, a placa do carro. São perguntas diferentes.
          */}
          {comparavel && (shown.pastImageUri || shown.presentImageUri) ? (
            <View style={styles.verGrande}>
              {shown.pastImageUri !== undefined ? (
                <Pressable
                  style={styles.verGrandeBtn}
                  onPress={() =>
                    setLupa({ fonte: shown.pastImageUri!, legenda: shown.year })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Ver grande a foto de ${shown.year}`}>
                  <Icon name="search" size={14} color={colors.esmalte} strokeWidth={2.2} />
                  <Body style={styles.verGrandeText}>Ver {shown.year} grande</Body>
                </Pressable>
              ) : null}
              {shown.presentImageUri !== undefined ? (
                <Pressable
                  style={styles.verGrandeBtn}
                  onPress={() => setLupa({ fonte: shown.presentImageUri!, legenda: 'Hoje' })}
                  accessibilityRole="button"
                  accessibilityLabel="Ver grande a foto de hoje">
                  <Icon name="search" size={14} color={colors.esmalte} strokeWidth={2.2} />
                  <Body style={styles.verGrandeText}>Ver hoje grande</Body>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View style={styles.body}>
            {shown.audioSeconds ? (
              <Pressable
                style={[styles.audio, !tocavel && styles.audioMudo]}
                disabled={!tocavel}
                onPress={() => {
                  if (playing) {
                    player.pause();
                  } else {
                    player.seekTo(0);
                    player.play();
                  }
                }}
                accessibilityRole="button"
                accessibilityState={{ disabled: !tocavel }}
                accessibilityLabel={
                  !tocavel
                    ? 'Áudio de exemplo, sem arquivo neste protótipo'
                    : playing
                      ? 'Pausar o relato em áudio'
                      : `Ouvir o relato de ${shown.author.name}, ${formatDuration(shown.audioSeconds)}`
                }>
                <View style={[styles.audioPlay, !tocavel && styles.audioPlayMudo]}>
                  <Icon name={playing ? 'pause' : 'play'} size={16} color="#FFFFFF" filled />
                </View>
                <View style={styles.wave}>
                  {WAVE.map((h, i) => (
                    <View
                      key={i}
                      style={[styles.waveBar, { height: `${h}%`, opacity: playing ? 0.85 : 0.5 }]}
                    />
                  ))}
                </View>
                <Mono style={styles.audioTime}>
                  {tocavel ? formatDuration(shown.audioSeconds) : 'exemplo'}
                </Mono>
              </Pressable>
            ) : null}

            <StoryText story={shown.story} emphasis={shown.emphasis} />

            <Pressable
              style={styles.lerAlto}
              onPress={() => {
                if (lendo) {
                  Speech.stop();
                  setLendo(false);
                  return;
                }
                setLendo(true);
                Speech.speak(shown.story, {
                  language: 'pt-BR',
                  rate: 0.95,
                  onDone: () => setLendo(false),
                  onStopped: () => setLendo(false),
                  onError: () => setLendo(false),
                });
              }}
              accessibilityRole="button"
              accessibilityLabel={
                lendo ? 'Parar a leitura em voz alta' : 'Ouvir o app ler este relato em voz alta'
              }>
              <Icon
                name={lendo ? 'pause' : 'play'}
                size={14}
                color={colors.esmalte}
                filled
              />
              <Body style={styles.lerAltoText}>
                {lendo ? 'Parar a leitura' : 'Ler para mim'}
              </Body>
            </Pressable>

            {/*
              O próximo capítulo, logo depois do relato — onde o "e aí?"
              nasce. Troca o conteúdo da folha sem navegar, como o feed.
            */}
            {continuacao ? (
              <Pressable
                style={styles.continua}
                onPress={() => {
                  swap(continuacao.id);
                  scroller.current?.scrollTo({ y: 0, animated: motion });
                }}
                accessibilityRole="button"
                accessibilityLabel={`A história continua em ${continuacao.title}, ${continuacao.year}. Abrir.`}>
                <View style={{ flex: 1 }}>
                  <Mono style={styles.continuaRotulo}>A HISTÓRIA CONTINUA</Mono>
                  <Plaque style={styles.continuaTitulo}>{continuacao.title}</Plaque>
                  <Mono style={styles.continuaAno}>{continuacao.year}</Mono>
                </View>
                <Icon name="chevronRight" size={18} color={colors.sobreEsmalteDim} />
              </Pressable>
            ) : null}

            {/*
              Como chegar — com a honestidade no rótulo. A conta é em linha
              reta (Haversine ÷ passo de caminhada), não por rota nas ruas:
              dizer "12 min a pé" seco prometeria um cálculo que não fazemos.
              E sem GPS a linha some inteira — distância a partir de um centro
              de fallback seria mentira com aparência de precisão.
            */}
            {!denied ? (
              <View style={styles.chegar}>
                <Icon name="trail" size={15} color={colors.esmalte} strokeWidth={2.1} />
                <Body style={styles.chegarText}>
                  {formatDistance(distanceMeters(position, shown.coords))} daqui · ≈{' '}
                  {Math.max(1, Math.round(distanceMeters(position, shown.coords) / 78))} min a pé
                  em linha reta
                </Body>
              </View>
            ) : null}

            <View style={styles.byline}>
              <View style={styles.avatar}>
                <Plaque style={styles.avatarText}>{shown.author.name.charAt(0)}</Plaque>
              </View>
              <View style={{ flex: 1 }}>
                <Body style={styles.author}>
                  {shown.contadaPor ?? shown.author.name}
                </Body>
                <Mono style={styles.authorRole}>
                  {shown.contadaPor
                    ? 'contou · registrado por ' + shown.author.name
                    : shown.author.role}
                </Mono>
              </View>
              {shown.verified ? (
                <View style={styles.verified}>
                  <Icon name="checkCircle" size={15} color={colors.conferido} strokeWidth={2.4} />
                  <Body style={styles.verifiedText}>verificado</Body>
                </View>
              ) : null}
            </View>
          </View>

          {/*
            Procedência. O app pergunta "dá para saber quando foi?" a quem
            envia; mostrar de onde veio a própria informação é a contrapartida.
            E o crédito da foto não é gentileza — as imagens são de terceiros,
            sob licença que exige atribuição.
          */}
          {shown.fonte || shown.creditoFoto ? (
            <View style={styles.procedencia}>
              {shown.fonte ? (
                <Pressable
                  style={styles.fonteLinha}
                  onPress={() => Linking.openURL(shown.fonte!.url)}
                  accessibilityRole="link"
                  accessibilityLabel={`Abrir a fonte: ${shown.fonte.titulo}`}>
                  <Icon name="list" size={13} color={colors.esmalte} strokeWidth={2.2} />
                  <Body style={styles.fonteText}>{shown.fonte.titulo}</Body>
                </Pressable>
              ) : null}
              {shown.creditoFoto ? (
                <Body style={styles.credito}>{shown.creditoFoto}</Body>
              ) : null}
            </View>
          ) : null}

          <Pressable
            style={styles.placaFisica}
            onPress={() => {
              close();
              router.push({ pathname: '/placa/[id]', params: { id: shown.id } });
            }}
            accessibilityRole="button"
            accessibilityLabel="Gerar uma placa com QR para imprimir e colar no lugar">
            <Icon name="pinSolid" size={15} color={colors.esmalte} strokeWidth={2.1} />
            <View style={{ flex: 1 }}>
              <Body style={styles.placaFisicaTitulo}>Placa para imprimir</Body>
              <Body style={styles.placaFisicaNota}>
                Com QR — para colar no lugar onde isto aconteceu
              </Body>
            </View>
            <Icon name="chevronRight" size={16} color={colors.grafiteDim} />
          </Pressable>

          <View style={styles.actions}>
            <Action
              icon="share"
              label={gerando ? 'Gerando…' : 'Compartilhar'}
              onPress={compartilhar}
            />
            {/*
              "Linha do tempo" leva o mapa para a década desta memória e fecha
              a folha. Era um botão sem ação — desenhado, anunciado como botão
              para o leitor de tela, e inerte. Agora ele responde a pergunta
              que faz sentido ali: "o que mais aconteceu nesta época?"
            */}
            <Action
              icon="timeline"
              label={decadaDaMemoria !== null ? rotuloLongo(decadaDaMemoria) : 'Linha do tempo'}
              onPress={
                decadaDaMemoria !== null
                  ? () => {
                      escolherDecada(decadaDaMemoria);
                      close();
                    }
                  : undefined
              }
            />
            <Action
              icon="flag"
              label="Reportar"
              onPress={() => {
                close();
                router.push({ pathname: '/reportar', params: { id: shown.id } });
              }}
            />
          </View>

          {/*
            O lugar como fio: outras pessoas contando o mesmo ponto, em ordem
            de tempo, e o convite para somar a sua. É o que faz o pin deixar de
            ser um registro solto e virar um lugar que acumula.
          */}
          {shown.pontoId ? (
            <>
              <Plaque style={styles.moreTitle}>
                {doPonto.length === 0
                  ? 'Você seria a primeira pessoa a contar mais'
                  : doPonto.length === 1
                    ? 'Mais uma história deste lugar'
                    : `Mais ${doPonto.length} histórias deste lugar`}
              </Plaque>

              {doPonto.length > 0 ? (
                <View style={styles.feed}>
                  {doPonto.map((m) => (
                    <Pressable
                      key={m.id}
                      style={styles.feedItem}
                      onPress={() => {
                        swap(m.id);
                        scroller.current?.scrollTo({ y: 0, animated: motion });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${m.title}, ${m.year}. Abrir.`}>
                      <Mono style={styles.feedAno}>{m.year}</Mono>
                      <View style={styles.feedTexto}>
                        <Plaque style={styles.feedTitulo}>{m.title}</Plaque>
                        <Body style={styles.feedAutor}>{m.author.name}</Body>
                      </View>
                      <Icon name="chevronRight" size={16} color={colors.grafiteDim} />
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <Pressable
                style={styles.contarAqui}
                onPress={() => {
                  close();
                  router.push({
                    pathname: '/adicionar',
                    params: { ponto: shown.pontoId as string },
                  });
                }}
                accessibilityRole="button"
                accessibilityLabel="Contar uma memória sua neste lugar">
                <Icon name="plus" size={17} color={colors.sobreFerrugem} strokeWidth={2.6} />
                <Body style={styles.contarAquiText}>Contar a minha aqui</Body>
              </Pressable>
            </>
          ) : null}

          <Plaque style={styles.moreTitle}>Por perto</Plaque>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moreRow}>
            {others.map(({ m, metros }) => (
              <MemoryCard
                key={m.id}
                memory={m}
                distance={formatDistance(metros)}
                // troca o conteúdo da folha: sem navegação, sem recarregar tela
                onPress={() => {
                  swap(m.id);
                  scroller.current?.scrollTo({ y: 0, animated: motion });
                }}
              />
            ))}
          </ScrollView>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/** Destaca em Fraunces o trecho que abre a história — o "drop" do protótipo. */
function StoryText({ story, emphasis }: { story: string; emphasis?: string }) {
  if (!emphasis || !story.includes(emphasis)) {
    return <Story style={styles.story}>{story}</Story>;
  }
  const at = story.indexOf(emphasis);
  return (
    <Story style={styles.story}>
      {story.slice(0, at)}
      <Story weight="semibold" style={styles.storyEmphasis}>
        {emphasis}
      </Story>
      {story.slice(at + emphasis.length)}
    </Story>
  );
}

function RoundBtn({
  icon,
  label,
  active,
  onPress,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.roundBtn, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Icon
        name={icon}
        size={19}
        color={active ? colors.esmalte : colors.grafite}
        filled={active}
      />
    </Pressable>
  );
}

function Action({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.action, pressed && { opacity: 0.75 }, !onPress && { opacity: 0.45 }]}
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !onPress }}
      accessibilityLabel={label}>
      <Icon name={icon} size={20} color={colors.grafite} />
      <Body style={styles.actionLabel}>{label}</Body>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.esmalteFundo,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: colors.cal,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    boxShadow: '0 -12px 40px rgba(0,0,0,0.55)',
  },

  grabberZone: { height: 26, alignItems: 'center', justifyContent: 'center' },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.calLine,
  },

  tools: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
    paddingBottom: space.md,
  },
  kind: { fontSize: 10.5, letterSpacing: 1.6, color: colors.grafiteDim },
  // sepia e nao emberDeep: alem de ser o token do passado, emberDeep sobre papel
  // da 2.74:1 e reprova no AA. sepia da 4.91:1.
  plate: { marginHorizontal: space.xl, boxShadow: '0 10px 26px rgba(15,43,84,0.30)' },
  plateInner: { paddingHorizontal: space.gutter, paddingVertical: space.lg },
  marker: { fontSize: 12, letterSpacing: 3.2, color: colors.sobreEsmalteDim },
  title: { fontSize: 32, lineHeight: 34, color: colors.sobreEsmalte, marginTop: 7 },
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md },
  period: { fontSize: 13, letterSpacing: 0.6, color: colors.sobreEsmalte },
  rule: { flexGrow: 1, height: 1, backgroundColor: 'rgba(244,243,238,0.34)' },
  address: { fontSize: 12.5, letterSpacing: 1.2, color: colors.sobreEsmalteDim, marginTop: space.sm },
  revisao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: space.md,
    paddingHorizontal: space.sm,
    paddingVertical: 6,
    backgroundColor: colors.sobreEsmalte,
  },
  revisaoText: { flex: 1, fontSize: 11.5, fontWeight: '600', color: colors.esmalte },
  headActions: { flexDirection: 'row', gap: space.sm },
  roundBtn: {
    width: HIT,
    height: HIT,
    borderRadius: HIT / 2,
    backgroundColor: colors.cal2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  hero: { marginHorizontal: 22, borderRadius: radius.md, overflow: 'hidden' },
  ampliar: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha.chrome,
  },
  verGrande: { flexDirection: 'row', gap: space.sm, marginHorizontal: 22, marginTop: space.sm },
  verGrandeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: HIT - 8,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderColor: colors.calLine,
  },
  verGrandeText: { fontSize: 12.5, fontWeight: '600', color: colors.esmalte },

  soloCap: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(15,43,84,0.72)',
  },
  soloCapText: { fontSize: 11, letterSpacing: 1, color: colors.sobreEsmalte },
  body: { paddingHorizontal: 22 },

  audio: {
    marginTop: space.gutter,
    minHeight: HIT + 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.cal2,
    borderWidth: 1,
    borderColor: colors.calLine,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  audioMudo: { opacity: 0.55 },
  audioPlayMudo: { backgroundColor: colors.grafiteDim },
  audioPlay: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.esmalte,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: { flex: 1, height: 26, flexDirection: 'row', alignItems: 'center', gap: 3 },
  waveBar: { flex: 1, backgroundColor: colors.esmalte, borderRadius: 2 },
  audioTime: { fontSize: 11, color: colors.grafiteDim },

  story: { marginTop: space.gutter, fontSize: 17, lineHeight: 27, color: colors.grafite },
  storyEmphasis: { fontSize: 17, lineHeight: 27, color: colors.grafite },

  byline: {
    marginTop: space.gutter,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.calLine,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.esmalte,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, color: '#FFFFFF' },
  author: { fontSize: 13.5, fontWeight: '700', color: colors.grafite },
  authorRole: { fontSize: 11.5, letterSpacing: 0.3, color: colors.grafiteDim },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  verifiedText: { fontSize: 11, fontWeight: '700', color: colors.conferido },

  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 22, paddingTop: space.lg },
  action: {
    flex: 1,
    minHeight: HIT + 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.cal2,
    borderWidth: 1,
    borderColor: colors.calLine,
    borderRadius: radius.md,
    paddingVertical: 11,
    paddingHorizontal: 4,
  },
  actionLabel: { fontSize: 11.5, fontWeight: '600', color: colors.grafite, textAlign: 'center' },

  feed: { gap: 1, marginTop: space.sm },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: HIT + 6,
    paddingHorizontal: space.md,
    backgroundColor: colors.cal2,
  },
  feedAno: { fontSize: 13, color: colors.esmalte, width: 40 },
  feedTexto: { flex: 1 },
  feedTitulo: { fontSize: 15, lineHeight: 17, color: colors.grafite },
  feedAutor: { fontSize: 11.5, color: colors.grafiteDim, marginTop: 2 },
  contarAqui: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: HIT + 2,
    marginTop: space.md,
    backgroundColor: colors.ferrugem,
  },
  contarAquiText: { fontSize: 14.5, fontWeight: '600', color: colors.sobreFerrugem },

  procedencia: {
    marginTop: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.calLine,
    gap: 6,
  },
  fonteLinha: { flexDirection: 'row', gap: 7, alignItems: 'flex-start', minHeight: 22 },
  fonteText: { flex: 1, fontSize: 12.5, lineHeight: 17.5, color: colors.esmalte },
  credito: { fontSize: 11.5, lineHeight: 16, color: colors.grafiteDim },

  // fora da tela, mas montado: view-shot precisa de layout real para capturar
  forasDeCena: { position: 'absolute', left: -2000, top: 0 },
  cartao: { width: 900, backgroundColor: colors.esmalte, padding: 56, position: 'relative' },
  cartaoMoldura: { borderWidth: 5, borderColor: colors.sobreEsmalte, padding: 52 },
  cartaoMarker: { fontSize: 22, letterSpacing: 6, color: colors.sobreEsmalteDim },
  cartaoTitulo: { fontSize: 76, lineHeight: 80, color: colors.sobreEsmalte, marginTop: 18 },
  cartaoRegua: { height: 2, backgroundColor: colors.esmalteClaro, marginTop: 34 },
  cartaoPeriodo: { fontSize: 30, color: colors.sobreEsmalteDim, marginTop: 26 },
  cartaoLugar: { fontSize: 26, color: colors.sobreEsmalteDim, marginTop: 10 },
  cartaoLasca: { position: 'absolute', right: 0, top: '40%', width: 18, height: 150, backgroundColor: colors.ferrugem },
  cartaoPe: { flexDirection: 'row', alignItems: 'baseline', gap: 18, marginTop: 34 },
  cartaoApp: { fontSize: 34, color: colors.sobreEsmalte },
  cartaoAssinatura: { fontSize: 20, color: colors.sobreEsmalteDim },

  // discreto de propósito: é ferramenta de acessibilidade ao lado do texto,
  // não concorrente do chip de áudio, que carrega a voz de quem viveu
  lerAlto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    marginTop: space.md,
    minHeight: HIT - 6,
    paddingRight: space.md,
  },
  lerAltoText: { fontSize: 13.5, fontWeight: '600', color: colors.esmalte },

  placaFisica: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginHorizontal: 22,
    marginTop: space.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.calLine,
    minHeight: HIT,
  },
  placaFisicaTitulo: { fontSize: 13.5, fontWeight: '600', color: colors.esmalte },
  placaFisicaNota: { fontSize: 11.5, color: colors.grafiteDim, marginTop: 2 },

  chegar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: space.lg,
    minHeight: 22,
  },
  chegarText: { flex: 1, fontSize: 12.5, color: colors.grafiteDim },

  // o elo entre capítulos: uma chapa fina, deitada
  continua: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.lg,
    padding: space.lg,
    backgroundColor: colors.esmalte,
    borderLeftWidth: 4,
    borderLeftColor: colors.ferrugem,
    minHeight: HIT + 8,
  },
  continuaRotulo: { fontSize: 9.5, letterSpacing: 2, color: colors.sobreEsmalteDim },
  continuaTitulo: { fontSize: 17, lineHeight: 19, color: colors.sobreEsmalte, marginTop: 4 },
  continuaAno: { fontSize: 12, color: colors.sobreEsmalteDim, marginTop: 3 },

  moreTitle: { fontSize: 17, color: colors.grafite, paddingHorizontal: 22, paddingTop: space.xxl },
  moreRow: { gap: space.md, paddingHorizontal: 22, paddingTop: 10, paddingBottom: space.xl },
});
