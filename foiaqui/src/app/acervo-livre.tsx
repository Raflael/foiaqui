import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Body, Eyebrow, Mono, Plaque } from '@/components/Type';
import { fotosPerto, type FotoDoCommons } from '@/data/commons';
import { fallbackPosition } from '@/data/location';
import { ErroDeRede, type MotivoDeFalha } from '@/data/rede';
import { useImportada } from '@/store/importada';
import { colors, HIT, space } from '@/theme';

type Estado = 'carregando' | 'pronto' | 'vazio' | 'erro';

/** O que dizer quando a consulta não voltou. Cada motivo pede uma frase diferente. */
const RECADO: Record<MotivoDeFalha, string> = {
  demorou:
    'A consulta demorou demais e eu desisti de esperar. Costuma ser sinal fraco — vale tentar de novo.',
  'sem-conexao':
    'O aparelho não conseguiu alcançar o acervo. Sem internet, esta busca não funciona — mas todo o resto do app, sim.',
  recusado: 'O acervo respondeu com erro. Não é você: é o servidor do Wikimedia agora.',
};

/**
 * Fotos livres já catalogadas perto daqui.
 *
 * O medo nº 1 da PO é o mapa vazio, e o caminho mais barato para enchê-lo não
 * é pedir fotos: é ligar as que JÁ existem. Milhares de lugares brasileiros
 * estão fotografados e licenciados no Wikimedia Commons esperando alguém
 * contar a história deles. Quem vai falar do Mercado não precisa ter a foto —
 * precisa saber que ela existe.
 *
 * A tela é deliberadamente um AJUDANTE do formulário, não um atalho para
 * publicar: escolher a foto volta para o passo da criação com o crédito
 * preenchido, e a pessoa ainda tem que contar a história. Importar imagem
 * sem relato produziria um banco de fotos, não um acervo de memória — e o
 * produto vale pelo texto, não pelo arquivo.
 */
export default function AcervoLivreScreen() {
  const insets = useSafeAreaInsets();
  const { lat, lng } = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const guardar = useImportada((s) => s.guardar);

  const [estado, setEstado] = useState<Estado>('carregando');
  const [motivo, setMotivo] = useState<MotivoDeFalha>('sem-conexao');
  const [tentativa, setTentativa] = useState(0);
  const [fotos, setFotos] = useState<FotoDoCommons[]>([]);

  const ponto = {
    lat: lat ? Number(lat) : fallbackPosition.lat,
    lng: lng ? Number(lng) : fallbackPosition.lng,
  };

  useEffect(() => {
    let vivo = true;
    setEstado('carregando');
    fotosPerto(ponto)
      .then((r) => {
        if (!vivo) return;
        setFotos(r);
        setEstado(r.length ? 'pronto' : 'vazio');
      })
      .catch((e) => {
        if (!vivo) return;
        setMotivo(e instanceof ErroDeRede ? e.motivo : 'sem-conexao');
        setEstado('erro');
      });
    return () => {
      vivo = false;
    };
    // a busca depende só do ponto recebido pela rota
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, tentativa]);

  const escolher = (f: FotoDoCommons) => {
    guardar({ uri: f.imagem, credito: f.credito, titulo: f.titulo });
    router.back();
  };

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
          <Eyebrow style={styles.eyebrow}>Acervo livre</Eyebrow>
          <Plaque style={styles.titulo}>Fotos deste lugar</Plaque>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.gutter,
          paddingBottom: insets.bottom + space.xxl,
        }}
        showsVerticalScrollIndicator={false}>
        <Body style={styles.explica}>
          Fotos com licença livre já catalogadas no Wikimedia Commons a até 800 metros daqui.
          Escolher uma preenche a foto e o crédito — a história continua sendo sua.
        </Body>

        {estado === 'carregando' ? (
          <View style={styles.aviso}>
            <Mono style={styles.avisoMono}>procurando…</Mono>
          </View>
        ) : null}

        {estado === 'erro' ? (
          <View style={styles.falha}>
            <View style={styles.falhaTopo}>
              <Icon name="flag" size={18} color={colors.ferrugem} strokeWidth={2.2} />
              <Body style={styles.falhaText}>{RECADO[motivo]}</Body>
            </View>
            <View style={styles.falhaAcoes}>
              <Pressable
                style={styles.tentar}
                onPress={() => setTentativa((n) => n + 1)}
                accessibilityRole="button"
                accessibilityLabel="Tentar buscar de novo">
                <Body style={styles.tentarText}>Tentar de novo</Body>
              </Pressable>
              <Pressable
                style={styles.seguir}
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Voltar e seguir sem foto do acervo">
                <Body style={styles.seguirText}>Seguir sem isto</Body>
              </Pressable>
            </View>
            <Body style={styles.falhaNota}>
              Sua memória não depende desta busca: dá para enviar com foto sua, ou sem foto
              nenhuma.
            </Body>
          </View>
        ) : null}

        {estado === 'vazio' ? (
          <View style={styles.aviso}>
            <Icon name="camera" size={18} color={colors.grafiteDim} strokeWidth={2} />
            <Body style={styles.avisoText}>
              Nenhuma foto livre catalogada por aqui. Isso é comum fora dos pontos turísticos — e
              é exatamente por isso que a sua foto vale tanto.
            </Body>
          </View>
        ) : null}

        {fotos.map((f) => (
          <View key={f.id} style={styles.item}>
            <Image source={{ uri: f.miniatura }} style={styles.miniatura} contentFit="cover" />
            <View style={styles.itemTexto}>
              <Body style={styles.itemTitulo} numberOfLines={2}>
                {f.titulo}
              </Body>
              <Mono style={styles.itemLicenca}>{f.licenca}</Mono>
              <Body style={styles.itemAutor} numberOfLines={1}>
                {f.autor}
              </Body>

              <View style={styles.itemAcoes}>
                <Pressable
                  style={styles.usar}
                  onPress={() => escolher(f)}
                  accessibilityRole="button"
                  accessibilityLabel={`Usar a foto ${f.titulo}, de ${f.autor}, ${f.licenca}`}>
                  <Body style={styles.usarText}>Usar esta</Body>
                </Pressable>
                {f.paginaUrl ? (
                  <Pressable
                    style={styles.origem}
                    onPress={() => Linking.openURL(f.paginaUrl)}
                    accessibilityRole="link"
                    accessibilityLabel="Abrir a página da foto no Wikimedia Commons">
                    <Body style={styles.origemText}>Ver origem</Body>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        ))}

        {estado === 'pronto' ? (
          <View style={styles.rodape}>
            <Icon name="shield" size={14} color={colors.grafiteDim} strokeWidth={2.1} />
            <Body style={styles.rodapeText}>
              Só aparecem aqui licenças que permitem redistribuição — CC0, CC BY, CC BY-SA e
              domínio público. O crédito vai junto na memória, porque é o que essas licenças
              exigem em troca.
            </Body>
          </View>
        ) : null}
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
  titulo: { fontSize: 20, color: colors.sobreEsmalte, marginTop: 2 },

  explica: { fontSize: 13.5, lineHeight: 20, color: colors.grafiteDim, marginTop: space.lg },

  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    marginTop: space.lg,
    padding: space.lg,
    backgroundColor: colors.cal2,
  },
  avisoMono: { fontSize: 12.5, color: colors.grafiteDim },
  avisoText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.grafiteDim },

  falha: { gap: space.md, marginTop: space.lg, padding: space.md, backgroundColor: colors.cal2 },
  falhaTopo: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  falhaText: { flex: 1, fontSize: 13.5, lineHeight: 20, color: colors.grafite },
  falhaAcoes: { flexDirection: 'row', gap: space.sm },
  tentar: {
    flex: 1,
    minHeight: HIT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ferrugem,
  },
  tentarText: { fontSize: 14.5, fontWeight: '600', color: colors.sobreFerrugem },
  seguir: {
    flex: 1,
    minHeight: HIT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.esmalte,
  },
  seguirText: { fontSize: 14.5, fontWeight: '600', color: colors.esmalte },
  falhaNota: { fontSize: 11.5, lineHeight: 17, color: colors.grafiteDim },

  item: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.lg,
    paddingBottom: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.calLine,
  },
  miniatura: { width: 96, height: 96, backgroundColor: colors.cal3 },
  itemTexto: { flex: 1 },
  itemTitulo: { fontSize: 14, lineHeight: 19, color: colors.grafite },
  itemLicenca: { fontSize: 11, color: colors.conferido, marginTop: 4 },
  itemAutor: { fontSize: 11.5, color: colors.grafiteDim, marginTop: 2 },
  itemAcoes: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  usar: {
    minHeight: HIT - 8,
    paddingHorizontal: space.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.esmalte,
  },
  usarText: { fontSize: 13, fontWeight: '600', color: colors.sobreEsmalte },
  origem: {
    minHeight: HIT - 8,
    paddingHorizontal: space.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.calLine,
  },
  origemText: { fontSize: 13, color: colors.grafiteDim },

  rodape: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
    marginTop: space.lg,
    padding: space.md,
    backgroundColor: colors.cal2,
  },
  rodapeText: { flex: 1, fontSize: 11.5, lineHeight: 17, color: colors.grafiteDim },
});
