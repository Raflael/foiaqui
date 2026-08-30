import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { Icon } from '@/components/Icon';
import { Body, Eyebrow, Mono, Plaque } from '@/components/Type';
import { useMemoria } from '@/store/acervo';
import { colors, FRAME, HIT, space } from '@/theme';

/**
 * A placa física: o app devolvendo a memória para a parede.
 *
 * O produto inteiro nasce de uma placa esmaltada que sumiu das ruas. Esta
 * tela fecha o ciclo — imprime uma placa de papel com o QR que abre a
 * memória, para colar no muro do lugar onde a coisa aconteceu. A placa
 * digital vira placa de verdade, e o prédio passa a apontar para a história
 * dele.
 *
 * É a ponte que a pesquisa pedia entre o acervo e o mundo (o QR em ponto
 * histórico da Rota), e serve ao caso concreto de escola e instituição:
 * um mutirão produz trinta placas e a cidade fica marcada num sábado.
 *
 * Preto sobre branco na versão impressa? Não: a chapa impressa mantém o
 * azul. Imprimir em cinza descaracterizaria justamente o objeto que o
 * projeto está citando — e uma placa de papel sem a cor da placa de ferro
 * não é a mesma placa.
 */
export default function PlacaScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const memoria = useMemoria(id);
  const folha = useRef<View>(null);
  const [gerando, setGerando] = useState(false);

  const link = `foiaqui://m/${id}`;

  const exportar = async () => {
    if (gerando) return;
    setGerando(true);
    try {
      const podeArquivo = await Sharing.isAvailableAsync();
      if (podeArquivo && folha.current) {
        const uri = await captureRef(folha, { format: 'png', quality: 1 });
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Placa para imprimir',
        });
      } else {
        await Share.share({ message: `Placa do FoiAqui — ${memoria?.title}\n${link}` });
      }
    } catch {
      // exportar é o objetivo da tela; falhar em silêncio deixaria a pessoa
      // apertando o botão sem entender
      await Share.share({ message: `Placa do FoiAqui — ${memoria?.title}\n${link}` }).catch(
        () => {},
      );
    } finally {
      setGerando(false);
    }
  };

  if (!memoria) {
    return (
      <View style={[styles.tela, styles.vazia, { paddingTop: insets.top + space.xxl }]}>
        <Plaque style={styles.vaziaTitulo}>Memória não encontrada</Plaque>
        <Pressable style={styles.voltarBtn} onPress={() => router.back()}>
          <Body style={styles.voltarBtnText}>Voltar</Body>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.tela}>
      <View style={[styles.topo, { paddingTop: insets.top + space.md }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.voltar}
          accessibilityRole="button"
          accessibilityLabel="Voltar">
          <Icon name="chevronLeft" size={20} color={colors.sobreEsmalte} strokeWidth={2.4} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Eyebrow style={styles.eyebrow}>Placa para imprimir</Eyebrow>
          <Plaque style={styles.titulo}>{memoria.title}</Plaque>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.gutter,
          paddingBottom: insets.bottom + space.xxl,
        }}
        showsVerticalScrollIndicator={false}>
        <Body style={styles.explica}>
          Imprima e cole no lugar onde isto aconteceu. Quem passar aponta a câmera e lê a memória
          — o prédio passa a contar a própria história.
        </Body>

        {/* a folha: é exatamente isto que sai na imagem */}
        <View ref={folha} collapsable={false} style={styles.folha}>
          <View style={styles.moldura}>
            <Eyebrow style={styles.marker}>{memoria.marker}</Eyebrow>
            <Plaque style={styles.nome}>{memoria.title}</Plaque>
            <Mono style={styles.periodo}>{memoria.period}</Mono>
            <View style={styles.regua} />
            <Plaque weight="semibold" style={styles.lugar}>
              {memoria.place}
            </Plaque>

            <View style={styles.qrBloco}>
              <View style={styles.qrCaixa}>
                <QRCode
                  value={link}
                  size={104}
                  backgroundColor={colors.sobreEsmalte}
                  color={colors.esmalteFundo}
                />
              </View>
              <View style={styles.qrTexto}>
                <Plaque style={styles.qrChamada}>Aponte a câmera</Plaque>
                <Body style={styles.qrDica}>e veja o que foi aqui</Body>
                <Mono style={styles.qrApp}>FoiAqui</Mono>
              </View>
            </View>
          </View>
          <View style={styles.lasca} />
        </View>

        <Pressable
          style={[styles.exportar, gerando && styles.exportarOff]}
          onPress={exportar}
          disabled={gerando}
          accessibilityRole="button"
          accessibilityState={{ disabled: gerando }}
          accessibilityLabel="Salvar ou compartilhar a placa como imagem para imprimir">
          <Icon name="share" size={18} color={colors.sobreFerrugem} strokeWidth={2.2} />
          <Body style={styles.exportarText}>
            {gerando ? 'Gerando…' : 'Salvar imagem para imprimir'}
          </Body>
        </Pressable>

        <View style={styles.nota}>
          <Icon name="shield" size={14} color={colors.grafiteDim} strokeWidth={2.1} />
          <Body style={styles.notaText}>
            Peça autorização antes de fixar em propriedade alheia ou em bem tombado. A placa é um
            convite, não uma intervenção — e patrimônio se respeita começando pela parede.
          </Body>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.cal },

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
  titulo: { fontSize: 19, lineHeight: 21, color: colors.sobreEsmalte, marginTop: 2 },

  explica: { fontSize: 14, lineHeight: 21, color: colors.grafiteDim, marginTop: space.lg },

  folha: {
    marginTop: space.lg,
    backgroundColor: colors.esmalte,
    padding: space.lg,
    position: 'relative',
  },
  moldura: { borderWidth: FRAME, borderColor: colors.sobreEsmalte, padding: space.xl },
  marker: { color: colors.sobreEsmalteDim },
  nome: { fontSize: 30, lineHeight: 33, color: colors.sobreEsmalte, marginTop: 8 },
  periodo: { fontSize: 15, color: colors.sobreEsmalteDim, marginTop: 10 },
  regua: { height: 1, backgroundColor: colors.esmalteClaro, marginTop: space.lg },
  lugar: { fontSize: 13, color: colors.sobreEsmalteDim, marginTop: space.md },

  qrBloco: { flexDirection: 'row', alignItems: 'center', gap: space.lg, marginTop: space.xl },
  // moldura branca em volta do QR: leitor de código precisa da zona de silêncio
  qrCaixa: { backgroundColor: colors.sobreEsmalte, padding: 10 },
  qrTexto: { flex: 1 },
  qrChamada: { fontSize: 17, lineHeight: 19, color: colors.sobreEsmalte },
  qrDica: { fontSize: 12.5, color: colors.sobreEsmalteDim, marginTop: 3 },
  qrApp: { fontSize: 11, letterSpacing: 2, color: colors.ferrugemSobreEscuro, marginTop: 10 },

  lasca: { position: 'absolute', right: 0, top: '42%', width: 8, height: 74, backgroundColor: colors.ferrugem },

  exportar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: HIT + 6,
    marginTop: space.xl,
    backgroundColor: colors.ferrugem,
  },
  exportarOff: { opacity: 0.6 },
  exportarText: { fontSize: 15, fontWeight: '600', color: colors.sobreFerrugem },

  nota: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
    marginTop: space.lg,
    padding: space.md,
    backgroundColor: colors.cal2,
  },
  notaText: { flex: 1, fontSize: 12, lineHeight: 17.5, color: colors.grafiteDim },

  vazia: { alignItems: 'center', gap: space.md, paddingHorizontal: space.xxl },
  vaziaTitulo: { fontSize: 20, color: colors.grafite },
  voltarBtn: {
    minHeight: HIT,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.esmalte,
  },
  voltarBtnText: { fontSize: 14.5, fontWeight: '600', color: colors.esmalte },
});
