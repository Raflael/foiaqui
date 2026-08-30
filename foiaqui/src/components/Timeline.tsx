import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Glass } from '@/components/Glass';
import { Body, Mono } from '@/components/Type';
import type { Decada } from '@/data/decadas';
import { colors, HIT, space } from '@/theme';

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

  return (
    <Glass style={styles.faixa} intensity={20}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trilho}>
        <Poste
          rotulo="tudo"
          ativo={selecionada === null}
          vazia={false}
          altura={BARRA_MAX}
          onPress={() => onSelecionar(null)}
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
            onPress={() => onSelecionar(selecionada === d.inicio ? null : d.inicio)}
            rotuloAcessivel={
              d.total === 0
                ? `${d.rotuloLongo}, nenhuma memória ainda`
                : `${d.rotuloLongo}, ${d.total === 1 ? '1 memória' : `${d.total} memórias`}`
            }
          />
        ))}
      </ScrollView>
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
