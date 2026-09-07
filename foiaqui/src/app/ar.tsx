import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, G, LinearGradient as SvgGradient, Line, Rect, Stop } from 'react-native-svg';

import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import { Body, Mono, Plaque } from '@/components/Type';
import {
  bearingTo,
  CAMERA_FOV,
  distanceTo,
  formatDistance,
  relativeAngle,
} from '@/data/location';
import { useCurrentPosition } from '@/hooks/useCurrentPosition';
import { useHeading } from '@/hooks/useHeading';
import { useInclinacao } from '@/hooks/useInclinacao';
import { useMotionEnabled } from '@/hooks/useMotion';
import { useMemorias } from '@/store/acervo';
import { useSheet } from '@/store/sheet';
import { alpha, colors, HIT, radius, space } from '@/theme';
import type { Memory } from '@/types';

/**
 * A câmera volta sozinha ao mapa depois disso sem nenhum toque.
 *
 * Decisão 9 da pesquisa: "nunca deixar a AR ligada de forma contínua — entrar,
 * entregar o momento, sair". Uso contínuo cansa o braço, enjoa e queima bateria,
 * e foi um dos três medos declarados da PO.
 */
const IDLE_MS = 45_000;

/** Quantas memórias flutuam sobre a cena ao mesmo tempo. Mais que isso vira sopa. */
const CARDS_NA_CENA = 3;

/**
 * Câmera AR — *simulada* nesta fase.
 *
 * Não é ARKit/ARCore: é o preview da câmera com cards em posição absoluta,
 * exatamente como o mockup. AR de verdade é v3 no roadmap. O que esta tela
 * precisa provar agora é a leitura visual — "a memória flutua no lugar dela".
 */
export default function ARScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const insets = useSafeAreaInsets();
  const motion = useMotionEnabled();
  const openSheet = useSheet((s) => s.open);
  const { position } = useCurrentPosition();
  const memorias = useMemorias();

  const heading = useHeading(true);
  const inclinacao = useInclinacao(true);
  const { width: larguraTela, height: alturaTela } = useWindowDimensions();

  /**
   * Onde está o horizonte na tela, em pixels a partir do topo.
   *
   * As memórias do acervo estão no chão, e coisa no chão a mais de trinta
   * metros aparece essencialmente na linha do horizonte — a diferença de
   * altura aparente entre o Mercado a 200 m e a Matriz a 400 m é menor que um
   * pixel. Então o que a inclinação move não é cada card: é o horizonte
   * inteiro, e os cards vão junto.
   *
   * É por isso que abaixar o celular empurra as memórias para cima da tela e
   * apontar para o céu as tira de vista — o que o corpo espera, e o que
   * faltava para a cena parecer um lugar em vez de um cartaz.
   *
   * O campo vertical sai do horizontal pela geometria da lente
   * (`tan(v/2) = tan(h/2) · altura/largura`), não por um número chutado: assim
   * a conta se ajusta sozinha a telas de proporção diferente. O limite superior
   * existe porque o preview da câmera é recortado para preencher a tela, e sem
   * ele um aparelho muito alto renderizaria um horizonte que quase não se mexe.
   *
   * Sem sensor, o horizonte fica onde sempre esteve e a tela funciona como antes.
   */
  const grau = Math.PI / 180;
  const FOV_VERTICAL = Math.min(
    100,
    (2 * Math.atan(Math.tan((CAMERA_FOV / 2) * grau) * (alturaTela / larguraTela))) / grau,
  );
  const horizonte =
    inclinacao === null ? null : alturaTela / 2 + (inclinacao / FOV_VERTICAL) * alturaTela;

  /** Todas as memórias com a distância real até você, calculada uma vez. */
  const comDistancia = memorias
    .map((m) => ({ m, metros: distanceTo(m, position) }))
    .sort((a, b) => a.metros - b.metros);

  /**
   * O que está na sua frente — nesta ordem, e a ordem é o conserto.
   *
   * Antes a tela pegava as três memórias mais próximas do mundo e SÓ DEPOIS
   * filtrava pelo campo de visão. Num lugar cercado de pontos, virar o corpo
   * para o quinto mais próximo não mostrava nada: ele tinha sido descartado
   * antes de a bússola opinar. A pessoa apontava o celular para o Mercado,
   * sabendo que ele estava ali, e via tela vazia — o jeito mais rápido de
   * concluir que "a AR não funciona".
   *
   * Agora o campo de visão filtra primeiro e a distância desempata depois:
   * o que aparece é sempre o mais próximo DAQUILO QUE VOCÊ ESTÁ OLHANDO.
   *
   * Continua não sendo ARKit: não há leitura de superfície nem oclusão por
   * prédio, e a altura na tela é derivada da distância, não medida.
   */
  const naCena = (() => {
    if (heading === null) {
      // sem bússola não há "frente": mostra o mais perto, nos cantos
      return comDistancia.slice(0, CARDS_NA_CENA).map((c) => ({ ...c, x: null, angulo: 0 }));
    }
    /*
     * Seleciona num campo 25% mais largo que o visível e posiciona no campo
     * real. Assim a memória que está na borda entra na cena com o card já
     * meio fora da tela e DESLIZA para dentro conforme você gira — em vez de
     * surgir do nada exatamente no limite. Fronteira binária num valor que
     * vem de sensor é receita de piscar: basta o ruído cruzar o limiar.
     */
    const FOV_SELECAO = CAMERA_FOV * 1.25;
    return comDistancia
      .map((c) => ({ ...c, angulo: relativeAngle(bearingTo(position, c.m.coords), heading) }))
      .filter((c) => Math.abs(c.angulo) <= FOV_SELECAO / 2)
      .slice(0, CARDS_NA_CENA)
      .map((c) => ({ ...c, x: 0.5 + c.angulo / CAMERA_FOV }));
  })();


  /**
   * Onde cada card fica, com profundidade e sem empilhar.
   *
   * Três coisas que a tela não fazia:
   *
   * 1. **Escala pela distância.** Um card a 30 m e outro a 800 m tinham o
   *    mesmo tamanho, e tamanho é a pista de profundidade mais forte que
   *    existe. Sem ela a cena é uma colagem, não um lugar.
   * 2. **Altura pela distância** — isso já havia: o que está longe flutua
   *    mais alto, como no horizonte.
   * 3. **Separação quando os azimutes coincidem.** Duas memórias quase na
   *    mesma direção caíam uma em cima da outra e a de baixo ficava
   *    inclicável. Agora a segunda desce o suficiente para as duas serem
   *    tocáveis — alvo sobreposto não é alvo.
   */
  const cartoes = naCena
    .map((c, i, todos) => {
      const t = Math.min(Math.max((c.metros - 40) / 560, 0), 1);

      // com sensor, o card mora perto do horizonte real; sem ele, na altura
      // fixa de antes — o que está longe flutua um pouco mais alto
      const base =
        horizonte === null
          ? insets.top + 96 + Math.min(c.metros / 12, 120)
          : horizonte - 150 - Math.min(c.metros / 24, 60);

      let top = base;

      // empurra para baixo se algum card anterior estiver quase no mesmo x
      if (c.x !== null) {
        for (let j = 0; j < i; j++) {
          const outro = todos[j];
          if (outro.x !== null && Math.abs(outro.x - c.x) < 0.28) top += 96;
        }
      }

      return { ...c, top, escala: 1 - 0.26 * t };
    })
    // apontou para o céu ou para o chão: o que saiu da tela sai mesmo
    // banda generosa pelo mesmo motivo: o card sai pela borda, não evapora
    .filter((c) => c.top > insets.top - 130 && c.top < alturaTela - 40);

  /** O que a fita mostra: as mais próximas, com a direção de cada uma. */
  const naFita =
    heading === null
      ? []
      : comDistancia.slice(0, NA_FITA).map((c) => {
          const angulo = relativeAngle(bearingTo(position, c.m.coords), heading);
          return { id: c.m.id, angulo, dentro: Math.abs(angulo) <= CAMERA_FOV / 2 };
        });

  /*
   * Vazio por dois motivos diferentes, e a frase certa depende de qual é.
   * "Gire à direita" para quem está de costas para a memória não ajuda quem
   * está apontando para o próprio sapato.
   */
  const foraDeVista = heading !== null && naCena.length === 0;
  const foraPorInclinacao = naCena.length > 0 && cartoes.length === 0;
  const maisProxima = comDistancia[0]?.m;

  const [listOpen, setListOpen] = useState(false);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdle = useCallback(() => {
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => router.back(), IDLE_MS);
  }, []);

  useEffect(() => {
    resetIdle();
    return () => {
      if (idle.current) clearTimeout(idle.current);
    };
  }, [resetIdle]);

  /** Abre a memória e sai da câmera: o momento foi entregue. */
  const reveal = (id: string) => {
    openSheet(id);
    router.back();
  };

  const showCamera = permission?.granted === true;

  return (
    <View style={styles.screen} onTouchStart={resetIdle}>
      {showCamera ? (
        <CameraView style={StyleSheet.absoluteFill} facing="back" />
      ) : (
        <CityFallback />
      )}

      <GridOverlay />
      {motion ? <ScanLine /> : null}

      {/* retículo de mira */}
      <View style={styles.reticle} pointerEvents="none">
        <View style={[styles.reticleTick, styles.reticleTickTop]} />
        <View style={[styles.reticleTick, styles.reticleTickBottom]} />
      </View>

      {/* cards ancorados nos "prédios" */}
{cartoes.map((c, i) => (
        <ARCard
          key={c.m.id}
          memory={c.m}
          distance={formatDistance(c.metros)}
          // sem bússola, cai no canto; com bússola, na direção real
          x={c.x}
          fallbackLeft={i % 2 === 0}
          top={c.top}
          escala={c.escala}
          delay={i * 900}
          onPress={reveal}
        />
      ))}

      {naFita.length > 0 ? (
        <View style={[styles.fitaCaixa, { top: insets.top + 64 }]}>
          <BussolaFita itens={naFita} fov={CAMERA_FOV} />
          <Mono style={styles.fitaLegenda}>
            {naFita.length === 1 ? '1 memória em volta' : `${naFita.length} memórias em volta`}
          </Mono>
        </View>
      ) : null}

      {foraPorInclinacao ? (
        <Glass tone="dark" style={[styles.bussola, { top: insets.top + 110 }]}>
          <Icon name="sparkle" size={16} color={colors.ferrugemSobreEscuro} />
          <Body style={styles.bussolaText}>
            {(inclinacao ?? 0) > 0 ? "Abaixe o celular" : "Levante o celular"} — a memória está
            na altura da rua.
          </Body>
        </Glass>
      ) : null}

      {/* nada no campo de visão: dizer para onde virar é mais útil que tela vazia */}
      {foraDeVista && maisProxima ? (
        <Glass tone="dark" style={[styles.bussola, { top: insets.top + 110 }]}>
          <Icon name="sparkle" size={16} color={colors.ferrugemSobreEscuro} />
          <Body style={styles.bussolaText}>
            Gire {relativeAngle(bearingTo(position, maisProxima.coords), heading ?? 0) > 0
              ? 'à direita'
              : 'à esquerda'}{' '}
            para encontrar {maisProxima.shortName}
          </Body>
        </Glass>
      ) : null}

      {heading === null ? (
        <Glass tone="dark" style={[styles.bussola, { top: insets.top + 110 }]}>
          <Body style={styles.bussolaText}>
            Sem bússola neste aparelho — as memórias aparecem sem direção.
          </Body>
        </Glass>
      ) : null}

      <Glass tone="dark" style={[styles.hint, { top: insets.top + space.md }]}>
        <Icon name="sparkle" size={18} color={colors.ferrugemSobreEscuro} />
        <View style={{ flex: 1 }}>
          <Body style={styles.hintText}>Aponte para um prédio ou praça</Body>
          <Mono style={styles.hintNote}>volta ao mapa sozinha para poupar bateria</Mono>
        </View>
      </Glass>

      {listOpen ? (
        <View style={[styles.list, { paddingBottom: insets.bottom + space.md }]}>
          <Body style={styles.listTitle}>Memórias por perto</Body>
          <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
            {[...memorias]
              .sort((a, b) => distanceTo(a, position) - distanceTo(b, position))
              .map((m) => (
              <Pressable
                key={m.id}
                style={styles.listRow}
                onPress={() => reveal(m.id)}
                accessibilityRole="button"
                accessibilityLabel={`${m.title}, ${m.year}, ${m.place}`}>
                <PhotoPlaceholder variant="past" style={styles.listThumb} />
                <View style={{ flex: 1 }}>
                  <Plaque style={styles.listRowTitle}>{m.title}</Plaque>
                  <Mono style={styles.listRowMeta}>
                    {m.year} · {formatDistance(distanceTo(m, position))}
                  </Mono>
                </View>
                <Icon name="chevronRight" size={18} color={colors.sobreEsmalteDim} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {permission && !permission.granted ? (
        <View style={[styles.permission, { bottom: insets.bottom + 170 }]}>
          <Body style={styles.permissionText}>
            Sem acesso à câmera — mostrando uma cena de exemplo.
          </Body>
          {permission.canAskAgain ? (
            <Pressable
              onPress={requestPermission}
              style={styles.permissionBtn}
              accessibilityRole="button"
              accessibilityLabel="Permitir acesso à câmera">
              <Body style={styles.permissionBtnText}>Permitir câmera</Body>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/*
        Decisão 8: a AR é camada opcional e precisa ter sempre um caminho de
        saída e um equivalente sem câmera. Daí os dois botões lado a lado.
      */}
      <View style={[styles.exits, { bottom: insets.bottom + space.xxl }]}>
        <Pressable
          style={styles.exitBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar ao mapa">
          <Icon name="arrowLeft" size={17} color={colors.sobreEsmalte} />
          <Body style={styles.exitText}>Mapa</Body>
        </Pressable>

        <Pressable
          style={[styles.exitBtn, listOpen && styles.exitBtnOn]}
          onPress={() => setListOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: listOpen }}
          accessibilityLabel={
            listOpen ? 'Fechar a lista de memórias próximas' : 'Ver memórias próximas em lista'
          }>
          <Icon name="list" size={17} color={listOpen ? colors.sobreFerrugem : colors.sobreEsmalte} />
          <Body style={[styles.exitText, listOpen && { color: colors.sobreFerrugem }]}>Lista</Body>
        </Pressable>
      </View>
    </View>
  );
}

/** Card de memória flutuando sobre a cena, com fio e ponto de ancoragem. */

/** Quantas memórias a fita considera. Mais que isso vira poeira na régua. */
const NA_FITA = 8;

/**
 * A fita da bússola: onde estão as memórias em volta, mesmo as que você não vê.
 *
 * A tela dizia apenas "gire à direita para encontrar X" — uma seta para uma
 * memória, e silêncio sobre todas as outras. Quem levanta o celular na rua não
 * está procurando uma coisa específica: está perguntando "tem o quê aqui?".
 *
 * A fita responde isso continuamente. Cada traço é uma memória na direção real
 * dela; o que está dentro do campo de visão acende em ferrugem, o que está
 * fora fica pálido e encosta na borda com uma seta. Girar o corpo faz os
 * traços deslizarem — que é o gesto que ensina o resto da tela sem texto.
 *
 * Janela de 180°: metade do horizonte por vez. Mostrar 360° comprimiria tudo
 * num amontoado onde dois traços a 40° de distância pareceriam vizinhos.
 */
function BussolaFita({
  itens,
  fov,
}: {
  itens: { id: string; angulo: number; dentro: boolean }[];
  fov: number;
}) {
  const JANELA = 180;

  return (
    <View style={styles.fita} pointerEvents="none">
      {/* a faixa do que a câmera alcança, para o traço aceso ter contexto */}
      <View
        style={[
          styles.fitaCampo,
          { left: `${50 - (fov / JANELA) * 50}%`, width: `${(fov / JANELA) * 100}%` },
        ]}
      />
      <View style={styles.fitaCentro} />

      {itens.map(({ id, angulo, dentro }) => {
        const preso = Math.max(-JANELA / 2, Math.min(JANELA / 2, angulo));
        const naBorda = Math.abs(angulo) > JANELA / 2;
        return (
          <View
            key={id}
            style={[
              styles.fitaTraco,
              dentro && styles.fitaTracoAceso,
              naBorda && styles.fitaTracoBorda,
              { left: `${50 + (preso / JANELA) * 100}%` },
            ]}
          />
        );
      })}
    </View>
  );
}
function ARCard({
  memory,
  distance,
  x,
  fallbackLeft,
  top,
  escala,
  delay,
  onPress,
}: {
  memory: Memory;
  distance: string;
  /** 0 a 1 na largura da tela; `null` quando não há bússola */
  x: number | null;
  fallbackLeft: boolean;
  top: number;
  /** 1 perto, menor conforme afasta — a pista de profundidade */
  escala: number;
  delay: number;
  onPress: (id: string) => void;
}) {
  const motion = useMotionEnabled();
  const float = useSharedValue(0);

  useEffect(() => {
    if (!motion) {
      float.value = 0;
      return;
    }
    float.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
  }, [motion, delay, float]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -6 * float.value }, { scale: escala }],
  }));

  const posicao =
    x === null
      ? fallbackLeft
        ? { left: 14, top }
        : { right: 14, top }
      : { left: `${Math.round(x * 100)}%` as const, top, marginLeft: -107 };

  return (
    <Animated.View style={[styles.card, posicao, floatStyle]}>
      <Pressable
        style={styles.cardInner}
        onPress={() => onPress(memory.id)}
        accessibilityRole="button"
        accessibilityLabel={`${memory.title}, ${memory.year}, a ${distance}. Abrir memória.`}>
        <PhotoPlaceholder variant="past" style={styles.cardThumb} />
        <View style={{ flex: 1 }}>
          <Plaque style={styles.cardTitle} numberOfLines={1}>
            {memory.title}
          </Plaque>
          <Mono style={styles.cardMeta}>
            {memory.year} · {distance}
          </Mono>
        </View>
      </Pressable>
      <View style={styles.tail} pointerEvents="none" />
      <View style={styles.anchorDot} pointerEvents="none" />
    </Animated.View>
  );
}

/** Cena desenhada pra quando a câmera não está disponível (emulador, permissão negada). */
function CityFallback() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <SvgGradient id="arSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0B1120" />
            <Stop offset="0.55" stopColor="#1A2740" />
            <Stop offset="1" stopColor="#26364F" />
          </SvgGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#arSky)" />
      </Svg>

      <Svg
        style={styles.fallbackBuildings}
        width="100%"
        height="100%"
        viewBox="0 0 404 300"
        preserveAspectRatio="xMidYMax slice">
        <G fill="#26364F">
          <Rect x={-10} y={70} width={90} height={240} />
          <Rect x={86} y={120} width={70} height={200} />
          <Rect x={250} y={40} width={80} height={270} />
          <Rect x={332} y={110} width={90} height={200} />
        </G>
        <Rect x={150} y={150} width={105} height={160} fill="#2F4160" />
        {/* janelas acesas */}
        <G fill="#3A4D6E">
          <Rect x={10} y={100} width={12} height={16} />
          <Rect x={34} y={100} width={12} height={16} />
          <Rect x={58} y={100} width={12} height={16} />
          <Rect x={10} y={140} width={12} height={16} />
          <Rect x={34} y={140} width={12} height={16} />
          <Rect x={266} y={80} width={12} height={16} />
          <Rect x={290} y={80} width={12} height={16} />
          <Rect x={266} y={120} width={12} height={16} />
        </G>
      </Svg>
    </View>
  );
}

/**
 * Malha de "leitura do espaço". Ela some no topo e aparece embaixo:
 * as verticais usam um gradiente no traço, as horizontais recebem
 * opacidade calculada — sai mais barato que uma máscara.
 */
function GridOverlay() {
  const step = 30;
  const rows = Array.from({ length: 10 }, (_, i) => (i + 1) * step);
  const cols = Array.from({ length: 14 }, (_, i) => i * step);

  return (
    <Svg
      style={StyleSheet.absoluteFill}
      width="100%"
      height="100%"
      viewBox="0 0 404 300"
      preserveAspectRatio="xMidYMid slice"
      pointerEvents="none">
      <Defs>
        <SvgGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0.3" stopColor="#78AAFF" stopOpacity={0} />
          <Stop offset="1" stopColor="#78AAFF" stopOpacity={0.28} />
        </SvgGradient>
      </Defs>
      <G strokeWidth={1}>
        {cols.map((x) => (
          <Line key={`v${x}`} x1={x} y1={0} x2={x} y2={300} stroke="url(#gridFade)" />
        ))}
        {rows.map((y) => (
          <Line
            key={`h${y}`}
            x1={0}
            y1={y}
            x2={404}
            y2={y}
            stroke="#78AAFF"
            strokeOpacity={Math.max(0, (y / 300 - 0.3) / 0.7) * 0.28}
          />
        ))}
      </G>
    </Svg>
  );
}

/** Varredura âmbar descendo pela cena — o app "lendo" o lugar. */
function ScanLine() {
  const { height } = useWindowDimensions();
  const y = useSharedValue(-120);

  useEffect(() => {
    y.value = withRepeat(withTiming(height, { duration: 4000, easing: Easing.linear }), -1, false);
  }, [height, y]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return (
    <Animated.View style={[styles.scan, style]} pointerEvents="none">
      <LinearGradient
        colors={['rgba(180,71,31,0)', 'rgba(180,71,31,0.16)', 'rgba(180,71,31,0)']}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fitaCaixa: { position: 'absolute', left: space.xl, right: space.xl, alignItems: 'center', gap: 5 },
  fita: {
    width: '100%',
    height: 22,
    justifyContent: 'center',
    backgroundColor: alpha.veu,
    overflow: 'hidden',
  },
  fitaCampo: { position: 'absolute', top: 0, bottom: 0, backgroundColor: alpha.chrome },
  fitaCentro: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    marginLeft: -0.5,
    backgroundColor: colors.sobreEsmalteDim,
  },
  fitaTraco: {
    position: 'absolute',
    top: 5,
    width: 2.5,
    height: 12,
    marginLeft: -1.25,
    backgroundColor: colors.sobreEsmalteDim,
  },
  fitaTracoAceso: { top: 2, height: 18, width: 3.5, marginLeft: -1.75, backgroundColor: colors.ferrugemSobreEscuro },
  fitaTracoBorda: { opacity: 0.45, height: 8, top: 7 },
  fitaLegenda: { fontSize: 10.5, letterSpacing: 0.6, color: colors.sobreEsmalteDim },
  screen: { flex: 1, backgroundColor: colors.esmalteFundo },
  fallbackBuildings: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },

  scan: { position: 'absolute', left: 0, right: 0, top: 0, height: 120 },

  reticle: {
    position: 'absolute',
    left: '50%',
    top: '44%',
    width: 46,
    height: 46,
    marginLeft: -23,
    marginTop: -23,
    borderWidth: 2,
    borderColor: 'rgba(244,243,238,0.75)',
    borderRadius: radius.md,
    zIndex: 10,
  },
  reticleTick: {
    position: 'absolute',
    left: '50%',
    marginLeft: -1,
    width: 2,
    height: 6,
    backgroundColor: colors.sobreEsmalte,
  },
  reticleTickTop: { top: -9 },
  reticleTickBottom: { bottom: -9 },

  hint: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.md,
    borderColor: colors.esmalteClaro,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  hintText: { fontSize: 13, fontWeight: '500', color: colors.sobreEsmalte },
  bussola: {
    position: 'absolute',
    left: space.xl,
    right: space.xl,
    zIndex: 21,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  bussolaText: { flex: 1, fontSize: 13, color: colors.sobreEsmalte },
  hintNote: { fontSize: 10, letterSpacing: 0.3, color: colors.sobreEsmalteDim, marginTop: 2 },

  list: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 24,
    backgroundColor: alpha.chrome,
    borderTopWidth: 1,
    borderTopColor: colors.calLine,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    paddingTop: space.lg,
    paddingHorizontal: space.gutter,
  },
  listTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.sobreEsmalteDim,
    textTransform: 'uppercase',
    marginBottom: space.sm,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: HIT + 20,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.calLine,
  },
  listThumb: { width: 48, height: 48, borderRadius: radius.sm },
  listRowTitle: { fontSize: 15, color: colors.sobreEsmalte },
  listRowMeta: { fontSize: 10.5, color: colors.ferrugemSobreEscuro, marginTop: 3 },

  card: { position: 'absolute', width: 214, zIndex: 16 },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: alpha.chrome,
    borderWidth: 1,
    borderColor: 'rgba(180,71,31,0.34)',
    borderRadius: radius.md,
    padding: 9,
    boxShadow: '0 14px 34px rgba(0,0,0,0.5)',
  },
  cardThumb: { width: 46, height: 46, borderRadius: radius.sm },
  cardTitle: { fontSize: 14, lineHeight: 16, color: colors.sobreEsmalte },
  cardMeta: { fontSize: 10.5, letterSpacing: 0.5, color: colors.ferrugemSobreEscuro, marginTop: 3 },
  // fio e ponto no centro do card: ele aponta para o ponto no chão
  tail: {
    position: 'absolute',
    bottom: -30,
    left: '50%',
    marginLeft: -1,
    width: 2,
    height: 30,
    backgroundColor: colors.ferrugem,
  },
  anchorDot: {
    position: 'absolute',
    left: '50%',
    marginLeft: -6,
    bottom: -36,
    width: 12,
    height: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.ferrugem,
    boxShadow: '0 0 12px rgba(180,71,31,0.85)',
  },

  permission: {
    position: 'absolute',
    left: space.xl,
    right: space.xl,
    zIndex: 22,
    alignItems: 'center',
    gap: space.md,
  },
  permissionText: {
    fontSize: 12.5,
    color: colors.sobreEsmalteDim,
    textAlign: 'center',
  },
  permissionBtn: {
    minHeight: HIT,
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.ferrugem,
  },
  permissionBtnText: { fontSize: 14, fontWeight: '700', color: colors.sobreFerrugem },

  exits: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 25,
    flexDirection: 'row',
    gap: space.sm,
  },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: HIT,
    minWidth: 110,
    paddingHorizontal: space.gutter,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.calLine,
    backgroundColor: alpha.chrome,
  },
  exitBtnOn: { backgroundColor: colors.ferrugem, borderColor: colors.ferrugem },
  exitText: { fontSize: 13, fontWeight: '600', color: colors.sobreEsmalte },
});
