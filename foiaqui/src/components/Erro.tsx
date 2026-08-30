import { router } from 'expo-router';
import { Component, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Body, Eyebrow, Plaque } from '@/components/Type';
import { colors, FRAME, HIT, space } from '@/theme';

/**
 * A rede embaixo do app inteiro.
 *
 * Sem isto, um erro de runtime em produção é tela branca: o app morre sem
 * dizer uma palavra, e a pessoa na rua não sabe se foi ela, o sinal ou o
 * telefone. Foi exatamente o modo de falha do crash dos hooks — e enquanto
 * bugs existirem (existirão), a diferença entre "travou tudo" e "deu errado,
 * volte ao mapa" é quem decide se a pessoa abre o app de novo.
 *
 * Classe porque error boundary ainda é o único lugar do React onde classe é
 * obrigatória — não há hook equivalente a getDerivedStateFromError.
 *
 * A tela de erro fala a língua da casa: uma chapa dizendo o que houve, sem
 * jargão, sem stack trace, sem culpar ninguém. O detalhe técnico vai para o
 * console, onde é útil; na tela ele só assustaria.
 */
export class Erro extends Component<{ children: ReactNode }, { quebrou: boolean }> {
  state = { quebrou: false };

  static getDerivedStateFromError() {
    return { quebrou: true };
  }

  componentDidCatch(error: unknown) {
    // para o desenvolvimento e para um crash reporter futuro
    console.error('[FoiAqui] erro apanhado pela rede:', error);
  }

  private recuperar = () => {
    this.setState({ quebrou: false });
    // volta para o chão conhecido: o mapa
    try {
      router.replace('/');
    } catch {
      // se nem o router estiver de pé, o remount do children já é a tentativa
    }
  };

  render() {
    if (!this.state.quebrou) return this.props.children;

    return (
      <View style={styles.tela}>
        <View style={styles.chapa}>
          <View style={styles.moldura}>
            <Eyebrow style={styles.eyebrow}>Foi aqui</Eyebrow>
            <Plaque style={styles.titulo}>Algo saiu do lugar</Plaque>
          </View>
          <View style={styles.lasca} />
        </View>

        <Body style={styles.texto}>
          Um erro inesperado interrompeu esta tela. Suas memórias estão guardadas no aparelho —
          nada se perdeu.
        </Body>

        <Pressable
          style={styles.voltar}
          onPress={this.recuperar}
          accessibilityRole="button"
          accessibilityLabel="Voltar ao mapa">
          <Body style={styles.voltarText}>Voltar ao mapa</Body>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: colors.cal,
    justifyContent: 'center',
    padding: space.gutter,
  },
  chapa: { backgroundColor: colors.esmalte, padding: space.lg, position: 'relative' },
  moldura: { borderWidth: FRAME, borderColor: colors.sobreEsmalte, padding: space.xl },
  lasca: { position: 'absolute', right: 0, top: '34%', width: 7, height: 56, backgroundColor: colors.ferrugem },
  eyebrow: { color: colors.sobreEsmalteDim },
  titulo: { fontSize: 28, lineHeight: 31, color: colors.sobreEsmalte, marginTop: 6 },
  texto: { fontSize: 15, lineHeight: 22, color: colors.grafiteDim, marginTop: space.xl },
  voltar: {
    minHeight: HIT + 6,
    marginTop: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ferrugem,
  },
  voltarText: { fontSize: 15.5, fontWeight: '600', color: colors.sobreFerrugem },
});
