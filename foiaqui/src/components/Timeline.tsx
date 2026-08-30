import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Body, Mono } from '@/components/Type';
import type { Decada } from '@/data/decadas';
import { useMotionEnabled } from '@/hooks/useMotion';
import { colors, HIT, space } from '@/theme';

/**
 * Ritmo da varredura. Mais lento que parece necessário, de propósito: cada
 * passo reabre a janela de captura dos marcadores no Android (~1,2 s), e um
 * ritmo menor que ela deixaria pins em branco no meio da viagem.
 */
const PASSO_MS = 1700;

/** altura da barrinha: nunca zero, para a década vazia continuar clicável */
const BARRA_MIN = 5;
const BARRA_MAX = 24;
const POSTE = 52;

/**
 * A linha do tempo sobre o mapa — a "viagem no tempo" (Decisão 11).
 *
 * A evidência é o Street View histórico: quando um produto grande já ensinou
 * um padrão para navegar entre épocas do mesmo lugar, inventar outro só cobra
 * do usuário o aprendizado de novo. Então é uma régua horizontal de décadas
 * sobre o mapa, no rodapé, ao alcance do polegar — o contexto de uso é uma mão
 * ocupada na rua (Decisão 7).
 *
 * Duas escolhas que valem explicação:
 *
 * **Toque, não arrasto.** O Street View arrasta, mas ali o alvo é um cursor
 * grosso numa faixa contínua. Aqui os alvos são décadas discretas, e a persona
 * principal tem 70 anos: arrastar com precisão é tarefa motora fina, tocar não
 * é. A régua rola quando não cabe, e rolar já é o gesto de varrer o tempo —
 * disputar esse mesmo gesto com uma seleção por arrasto daria conflito.
 *
 * **Década vazia continua na régua**, com um traço mínimo em vez de nada. O
 * buraco é a informação mais útil que o mapa tem para dar: "ninguém contou
 * nada dos anos 80 por aqui" é um convite, e some se a régua só listar o que
 * já existe.
 */
export function Timeline({
  decadas,
  selecionada,
  onSelecionar,
}: {
  decadas: Decada[];
  /** null = todas as épocas */
  selecionada: number | null;
  onSelecionar: (inicio: number | null) => void;
}) {
  const maior = Math.max(1, ...decadas.map((d) => d.total));
  const motion = useMotionEnabled();

  /**
   * A viagem no tempo com um toque: aperta o play e o mapa varre as décadas
   * sozinho, da mais antiga até hoje, e volta para "tudo" no fim.
   *
   * As décadas vazias FICAM no percurso — a pausa num ano sem nada é o mapa
   * dizendo "aqui ninguém contou ainda", que é a informação mais valiosa da
   * régua. Pular direto de 1920 para 1950 esconderia trinta anos de silêncio.
   *
   * Some quando a pessoa pediu menos movimento: varredura automática é
   * exatamente o tipo de animação que o reduce-motion existe para desligar.
   * E qualquer toque manual numa década interrompe — a mão ganha da máquina.
   */
  const [tocando, setTocando] = useState(false);
  const passo = useRef(0);

  useEffect(() => {
    if (!tocando) return;
    const t = setInterval(() => {
      if (passo.current >= decadas.length) {
        setTocando(false);
        onSelecionar(null);
        return;
      }
      onSelecionar(decadas[passo.current].inicio);
      passo.current += 1;
    }, PASSO_MS);
    return () => clearInterval(t);
  }, [tocando, decadas, onSelecionar]);

  const alternar = () => {
    if (tocando) {
      setTocando(false);
      return;
    }
    passo.current = 0;
    onSelecionar(decadas[0]?.inicio ?? null);
    passo.current = 1;
    setTocando(true);
  };

  const pararSeManual = (fn: () => void) => () => {
    setTocando(false);
    fn();
  };

  return (
    <Glass style={styles.faixa} intensity={20}>
      <View style={styles.linhaComPlay}>
      {motion ? (
        <Pressable
          style={[styles.play, tocando && styles.playAtivo]}
          onPress={alternar}
          accessibilityRole="button"
          accessibilityState={{ selected: tocando }}
          accessibilityLabel={
            tocando ? 'Parar a viagem pelas décadas' : 'Percorrer as décadas automaticamente'
          }>
          <Icon
            name={tocando ? 'pause' : 'play'}
            size={15}
            color={colors.sobreFerrugem}
            filled
          />
        </Pressable>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trilho}>
        <Poste
          rotulo="tudo"
          ativo={selecionada === null}
          vazia={false}
          altura={BARRA_MAX}
          onPress={pararSeManual(() => onSelecionar(null))}
          rotuloAcessivel="Todas as épocas"
        />

        {decadas.map((d) => (
          <Poste
            key={d.inicio}
            rotulo={d.rotulo}
            ativo={selecionada === d.inicio}
            vazia={d.total === 0}
            altura={
              d.total === 0
                ? BARRA_MIN
                : BARRA_MIN + ((BARRA_MAX - BARRA_MIN) * d.total) / maior
            }
            onPress={pararSeManual(() => onSelecionar(selecionada === d.inicio ? null : d.inicio))}
            rotuloAcessivel={
              d.total === 0
                ? `${d.rotuloLongo}, nenhuma memória ainda`
                : `${d.rotuloLongo}, ${d.total === 1 ? '1 memória' : `${d.total} memórias`}`
            }
          />
        ))}
      </ScrollView>
      </View>
    </Glass>
  );
}

function Poste({
  rotulo,
  ativo,
  vazia,
  altura,
  onPress,
  rotuloAcessivel,
}: {
  rotulo: string;
  ativo: boolean;
  vazia: boolean;
  altura: number;
  onPress: () => void;
  rotuloAcessivel: string;
}) {
  const cor = ativo ? colors.ferrugem : vazia ? colors.calLine : colors.esmalte;

  return (
    <Pressable
      style={styles.poste}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: ativo }}
      accessibilityLabel={rotuloAcessivel}>
      <View style={styles.barraArea}>
        <View style={[styles.barra, { height: altura, backgroundColor: cor }]} />
      </View>
      {rotulo === 'tudo' ? (
        <Body style={[styles.rotuloTudo, ativo && styles.rotuloOn]}>tudo</Body>
      ) : (
        <Mono style={[styles.rotulo, ativo && styles.rotuloOn, vazia && styles.rotuloVazio]}>
          {rotulo}
        </Mono>
      )}
      {/* o sublinhado é a marca da placa: reto, cheio, sem sombra */}
      <View style={[styles.marca, ativo && styles.marcaOn]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  faixa: { overflow: 'hidden' },
  linhaComPlay: { flexDirection: 'row', alignItems: 'center' },
  // círculo porque é corpo: botão de tocar, como o do áudio (regra da identidade)
  play: {
    width: HIT - 4,
    height: HIT - 4,
    borderRadius: (HIT - 4) / 2,
    marginLeft: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ferrugem,
  },
  playAtivo: { backgroundColor: colors.esmalte },
  trilho: { paddingHorizontal: space.sm },

  poste: {
    width: POSTE,
    minHeight: HIT + 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 6,
    paddingBottom: 5,
    gap: 3,
  },
  barraArea: { height: BARRA_MAX, justifyContent: 'flex-end' },
  barra: { width: 3 },
  rotulo: { fontSize: 12.5, color: colors.grafite },
  rotuloVazio: { color: colors.grafiteDim },
  rotuloTudo: { fontSize: 11.5, color: colors.grafite },
  rotuloOn: { color: colors.ferrugem, fontWeight: '600' },
  marca: { height: 2, width: 22, backgroundColor: 'transparent' },
  marcaOn: { backgroundColor: colors.ferrugem },
});
