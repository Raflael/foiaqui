import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Body, Eyebrow, Mono, Plaque } from '@/components/Type';
import { rotuloLongo } from '@/data/decadas';
import { pontoPor } from '@/data/pontos';
import { useAcervo, useMemoria } from '@/store/acervo';
import { autorDe, usePerfil } from '@/store/perfil';
import { colors, HIT, space } from '@/theme';
import type { Memory } from '@/types';

const ANO_MIN = 1830;

/**
 * Contribuir só com a foto antiga de um lugar que já existe.
 *
 * É a porta de entrada mais larga que este produto tem. "Vou escrever um
 * relato" trava a maioria das pessoas; "tenho a foto do álbum da vovó" não
 * trava ninguém — e é justamente o que falta na maior parte do acervo, onde
 * há a vista de hoje e nenhuma imagem do que havia antes.
 *
 * Sem esta porta, quem tem a foto e não tem o texto simplesmente não
 * contribui, e o produto perde exatamente o material mais raro.
 *
 * O que NÃO é dispensado: o ano. A Decisão 3 vale igual aqui — foto sem data
 * não entra na linha do tempo, não compara com o presente e não vira acervo
 * consultável. A legenda curta substitui o relato, porque uma frase dizendo o
 * que a foto mostra é o mínimo para alguém entender o que está vendo.
 */
export default function FotoAntigaScreen() {
  const insets = useSafeAreaInsets();
  const { ponto: pontoId, de } = useLocalSearchParams<{ ponto?: string; de?: string }>();

  const ponto = pontoPor(pontoId);
  const origem = useMemoria(de);
  const adicionar = useAcervo((s) => s.adicionar);

  const [foto, setFoto] = useState<string | null>(null);
  const [ano, setAno] = useState('');
  const [legenda, setLegenda] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);

  const anoAtual = new Date().getFullYear();
  const anoValido = /^\d{4}$/.test(ano) && +ano >= ANO_MIN && +ano <= anoAtual;
  const podeEnviar = !!foto && anoValido && legenda.trim().length >= 4;

  const lugar = ponto?.nome ?? origem?.place ?? 'este lugar';
  const coords = ponto?.coords ?? origem?.coords;

  const escolher = async (daCamera: boolean) => {
    const fn = daCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const r = await fn({ mediaTypes: ['images'], quality: 0.9 });
    if (!r.canceled && r.assets[0]) setFoto(r.assets[0].uri);
  };

  const enviar = () => {
    if (!podeEnviar || !coords) return;
    if (!usePerfil.getState().nome) {
      router.push({ pathname: '/entrar', params: { motivo: 'criar' } });
      return;
    }
    setEnviando(true);
    const agora = Date.now();
    const nova: Memory = {
      id: `foto-${agora}`,
      pontoId: ponto?.id ?? origem?.pontoId,
      title: legenda.trim().slice(0, 48),
      shortName: ponto?.shortName ?? origem?.shortName ?? 'Foto',
      marker: 'Aqui era assim',
      period: ano,
      year: ano,
      era: rotuloLongo(Math.floor(+ano / 10) * 10),
      place: ponto?.endereco ?? origem?.place ?? lugar,
      coords: { lat: coords.lat, lng: coords.lng },
      story: legenda.trim(),
      author: {
        name: autorDe(usePerfil.getState().nome),
        level: 1,
        role: 'Contribuição de foto',
      },
      kind: 'Foto histórica',
      verified: false,
      status: 'em_revisao',
      media: [{ type: 'photo', uri: foto! }],
      pastImageUri: foto!,
      // herda a vista de hoje da memória de origem: é o que faz o slider
      // passado↔presente nascer completo em vez de meia comparação
      presentImageUri: origem?.presentImageUri,
      tags: ['Foto histórica'],
    };
    setTimeout(() => {
      adicionar(nova);
      setEnviando(false);
      setPronto(true);
    }, 700);
  };

  if (pronto) {
    return (
      <View style={[styles.tela, styles.centro, { paddingTop: insets.top + space.xxl }]}>
        <Icon name="shieldCheck" size={38} color={colors.conferido} strokeWidth={1.8} />
        <Plaque style={styles.prontoTitulo}>Foto guardada</Plaque>
        <Body style={styles.prontoTexto}>
          Ela entra no acervo de {lugar} assim que a comunidade conferir. Se o lugar já tinha uma
          vista de hoje, agora dá para arrastar entre as duas épocas.
        </Body>
        <Pressable
          style={styles.fechar}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar">
          <Body style={styles.fecharText}>Voltar</Body>
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
          <Eyebrow style={styles.eyebrow}>Foto antiga</Eyebrow>
          <Plaque style={styles.titulo}>{lugar}</Plaque>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.gutter,
          paddingBottom: insets.bottom + space.xxl,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Body style={styles.explica}>
          Não precisa escrever memória nenhuma. Se você tem uma foto de como este lugar era,
          basta ela, o ano e uma frase dizendo o que aparece.
        </Body>

        {foto ? (
          <View style={styles.previa}>
            <Image source={{ uri: foto }} style={styles.previaImg} contentFit="cover" />
            <Pressable
              style={styles.trocar}
              onPress={() => setFoto(null)}
              accessibilityRole="button"
              accessibilityLabel="Escolher outra foto">
              <Icon name="x" size={14} color="#FFFFFF" strokeWidth={2.2} />
              <Body style={styles.trocarText}>Trocar</Body>
            </Pressable>
          </View>
        ) : (
          <View style={styles.escolhas}>
            <Pressable
              style={styles.botaoCheio}
              onPress={() => escolher(true)}
              accessibilityRole="button"
              accessibilityLabel="Fotografar a foto de papel">
              <Icon name="camera" size={18} color={colors.sobreEsmalte} strokeWidth={2} />
              <Body style={styles.botaoCheioText}>Fotografar do álbum</Body>
            </Pressable>
            <Pressable
              style={styles.botaoVazado}
              onPress={() => escolher(false)}
              accessibilityRole="button"
              accessibilityLabel="Escolher foto da galeria">
              <Icon name="image" size={18} color={colors.esmalte} strokeWidth={2} />
              <Body style={styles.botaoVazadoText}>Da galeria</Body>
            </Pressable>
          </View>
        )}

        <Body style={styles.rotulo}>De que ano é a foto?</Body>
        <TextInput
          style={styles.campo}
          value={ano}
          onChangeText={(v) => setAno(v.replace(/[^0-9]/g, '').slice(0, 4))}
          placeholder="1958"
          placeholderTextColor={colors.grafiteDim}
          keyboardType="number-pad"
          maxLength={4}
          accessibilityLabel="Ano da foto"
        />
        <Mono style={styles.ajudaAno}>
          {ano.length === 0
            ? `entre ${ANO_MIN} e ${anoAtual} — aproximado serve`
            : anoValido
              ? rotuloLongo(Math.floor(+ano / 10) * 10)
              : `precisa estar entre ${ANO_MIN} e ${anoAtual}`}
        </Mono>

        <Body style={styles.rotulo}>O que aparece na foto?</Body>
        <TextInput
          style={[styles.campo, styles.campoAlto]}
          value={legenda}
          onChangeText={setLegenda}
          placeholder="A fachada com o toldo listrado, antes da reforma"
          placeholderTextColor={colors.grafiteDim}
          multiline
          maxLength={140}
          accessibilityLabel="Uma frase dizendo o que a foto mostra"
        />

        <Pressable
          style={[styles.enviar, !podeEnviar && styles.enviarOff]}
          onPress={enviar}
          disabled={!podeEnviar || enviando}
          accessibilityRole="button"
          accessibilityState={{ disabled: !podeEnviar }}
          accessibilityLabel="Guardar esta foto no acervo do lugar">
          <Body style={[styles.enviarText, !podeEnviar && styles.enviarTextOff]}>
            {enviando ? 'Guardando…' : podeEnviar ? 'Guardar a foto' : 'Falta foto, ano ou frase'}
          </Body>
        </Pressable>

        <View style={styles.nota}>
          <Icon name="shield" size={14} color={colors.grafiteDim} strokeWidth={2.1} />
          <Body style={styles.notaText}>
            Envie fotos que sejam suas ou de família. Foto de terceiro precisa de autorização de
            quem a fez — a comunidade confere isso na revisão.
          </Body>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.cal },
  centro: { alignItems: 'center', gap: space.md, paddingHorizontal: space.xxl },

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
  titulo: { fontSize: 20, lineHeight: 22, color: colors.sobreEsmalte, marginTop: 2 },

  explica: { fontSize: 14, lineHeight: 21, color: colors.grafiteDim, marginTop: space.lg },

  escolhas: { gap: space.sm, marginTop: space.lg },
  botaoCheio: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: HIT + 6,
    backgroundColor: colors.esmalte,
  },
  botaoCheioText: { fontSize: 15, fontWeight: '600', color: colors.sobreEsmalte },
  botaoVazado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: HIT + 6,
    borderWidth: 1.5,
    borderColor: colors.esmalte,
  },
  botaoVazadoText: { fontSize: 15, fontWeight: '600', color: colors.esmalte },

  previa: { marginTop: space.lg, position: 'relative' },
  previaImg: { width: '100%', height: 220, backgroundColor: colors.cal3 },
  trocar: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: space.md,
    backgroundColor: 'rgba(15,43,84,0.93)',
  },
  trocarText: { fontSize: 12.5, fontWeight: '600', color: '#FFFFFF' },

  rotulo: { fontSize: 13, fontWeight: '600', color: colors.grafite, marginTop: space.lg },
  campo: {
    minHeight: HIT + 4,
    marginTop: 6,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderColor: colors.calLine,
    backgroundColor: colors.cal2,
    color: colors.grafite,
    fontSize: 15.5,
  },
  campoAlto: { minHeight: 84, paddingTop: space.md, textAlignVertical: 'top' },
  ajudaAno: { fontSize: 11.5, color: colors.grafiteDim, marginTop: 5 },

  enviar: {
    minHeight: HIT + 8,
    marginTop: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ferrugem,
  },
  enviarOff: { backgroundColor: colors.cal3 },
  enviarText: { fontSize: 15.5, fontWeight: '600', color: colors.sobreFerrugem },
  enviarTextOff: { color: colors.grafiteDim },

  nota: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
    marginTop: space.lg,
    padding: space.md,
    backgroundColor: colors.cal2,
  },
  notaText: { flex: 1, fontSize: 11.5, lineHeight: 17, color: colors.grafiteDim },

  prontoTitulo: { fontSize: 22, color: colors.grafite, marginTop: space.sm },
  prontoTexto: { fontSize: 14, lineHeight: 21, color: colors.grafiteDim, textAlign: 'center' },
  fechar: {
    minHeight: HIT,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.esmalte,
    marginTop: space.sm,
  },
  fecharText: { fontSize: 14.5, fontWeight: '600', color: colors.esmalte },
});
