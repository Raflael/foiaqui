import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Body, Eyebrow, Mono, Plaque } from '@/components/Type';
import { fotosPerto, type FotoDoCommons } from '@/data/commons';
import { fallbackPosition } from '@/data/location';
import { useImportada } from '@/store/importada';
import { colors, HIT, space } from '@/theme';

type Estado = 'carregando' | 'pronto' | 'vazio' | 'erro';

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
      .catch(() => {
        if (vivo) setEstado('erro');
      });
    return () => {
      vivo = false;
    };
    // a busca depende só do ponto recebido pela rota
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

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
          <View style={styles.aviso}>
            <Icon name="flag" size={18} color={colors.ferrugem} strokeWidth={2.2} />
            <Body style={styles.avisoText}>
              Não deu para consultar o acervo agora — pode ser o sinal. Sua memória não precisa
              disto: siga com foto sua ou sem foto.
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
