import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { Body, Mono, Plaque } from '@/components/Type';
import { conquistas, nivelPor } from '@/data/profile';
import { inicialDe, usePerfil } from '@/store/perfil';
import { useTrilhas } from '@/store/trilhasMinhas';
import { useAcervo, useMemorias } from '@/store/acervo';
import { trilhasCompletas, useCaminhada } from '@/store/caminhada';
import { useColecoes } from '@/store/colecoes';
import { useModeracao } from '@/store/moderacao';
import { useRascunho } from '@/store/rascunho';
import { useFila, useRevisoes } from '@/store/moderacao';
import { useSaved } from '@/store/saved';
import { useSettings } from '@/store/settings';
import { alpha, colors, HIT, radius, space, TABBAR_HEIGHT } from '@/theme';

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const [a11yOpen, setA11yOpen] = useState(false);

  const { largeText, simpleMode, toggleLargeText, toggleSimpleMode } = useSettings();

  /**
   * Tudo aqui vem do uso real. Antes eram números fixos — 27 memórias, 1,4 mil
   * visualizações — que nunca mudavam por mais que a pessoa contribuísse.
   * Estatística que não se mexe é enfeite, e ensina a ignorar a tela inteira.
   */
  const criadas = useAcervo((s) => s.criadas);
  const salvas = useSaved((s) => s.ids);
  const nome = usePerfil((s) => s.nome);
  const cidade = usePerfil((s) => s.cidade);
  const sair = usePerfil((s) => s.sair);
  const fila = useFila();
  const revisoes = useRevisoes();
  const memorias = useMemorias();
  const trails = useTrilhas();
  const chegadas = useCaminhada((s) => s.chegadas);
  const trilhasFeitas = trilhasCompletas(chegadas, trails, (mid) =>
    memorias.some((m) => m.id === mid),
  );

  /**
   * O reset do teste de usabilidade: devolve o aparelho ao estado de quem
   * nunca abriu o app. Sem isto, o segundo participante herda o acervo, o
   * nome e os pareceres do primeiro — e o teste mede a bagunça, não o app.
   *
   * Os ajustes de acessibilidade ficam DE FORA de propósito: fonte grande é
   * do aparelho e de quem o segura, não da sessão de teste.
   */
  const recomecarComoVisitante = () =>
    Alert.alert(
      'Recomeçar como visitante?',
      'Apaga deste aparelho: suas memórias, coleções, pareceres, caminhadas, rascunho e o nome. Os ajustes de acessibilidade ficam. Não dá para desfazer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar tudo',
          style: 'destructive',
          onPress: () => {
            useAcervo.setState({ criadas: [] });
            useSaved.setState({ ids: [] });
            useModeracao.setState({ pareceres: [], denuncias: [], pulados: [] });
            useCaminhada.setState({ chegadas: {} });
            useColecoes.setState({ colecoes: [] });
            useRascunho.getState().limpar();
            sair();
          },
        },
      ],
    );
  const nivel = nivelPor(criadas.length);
  const badges = conquistas(criadas.length, salvas.length, revisoes, trilhasFeitas);
  const emRevisao = criadas.filter((m) => m.status === 'em_revisao').length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + space.md,
        paddingBottom: TABBAR_HEIGHT + insets.bottom + space.xl,
      }}
      showsVerticalScrollIndicator={false}>
      <View style={styles.head}>
        <View style={styles.avatar}>
          <Plaque style={styles.avatarText}>{inicialDe(nome)}</Plaque>
          <View style={styles.level}>
            <Mono style={styles.levelText}>Nv {nivel.nivel}</Mono>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Plaque style={styles.name} numberOfLines={2}>
            {nome ?? 'Visitante'}
          </Plaque>
          <Mono style={styles.tag}>
            {nome ? `${nivel.titulo} · ${cidade}` : 'Explorando sem se identificar'}
          </Mono>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat value={String(criadas.length)} label={criadas.length === 1 ? 'memória' : 'memórias'} />
        <Stat value={String(salvas.length)} label={salvas.length === 1 ? 'salva' : 'salvas'} />
        <Stat value={String(emRevisao)} label="em revisão" />
      </View>

      <View style={styles.badges}>
        <Plaque style={styles.sectionTitle}>Conquistas</Plaque>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.badgeRow}>
          {badges.map((badge) => (
            <View key={badge.id} style={styles.badge}>
              <View style={[styles.badgeIcon, badge.earned && styles.badgeIconOn]}>
                <Icon
                  name={badge.icon as IconName}
                  size={30}
                  color={badge.earned ? colors.ferrugem : colors.grafiteDim}
                  strokeWidth={1.8}
                />
              </View>
              <Body
                style={[styles.badgeLabel, badge.earned && { color: colors.grafite }]}
                numberOfLines={2}>
                {badge.label}
              </Body>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.rows}>
        <Row
          icon="shieldCheck"
          title="Moderação da comunidade"
          subtitle={
            fila.length > 0
              ? `${fila.length} esperando parecer`
              : revisoes > 0
                ? `${revisoes} revisada${revisoes > 1 ? 's' : ''} por você`
                : 'Ajude a revisar novas memórias'
          }
          pill={fila.length > 0 ? String(fila.length) : undefined}
          onPress={() => router.push('/moderacao')}
        />
        <Row
          icon="user"
          title={nome ? 'Sua identidade' : 'Identificar-se'}
          subtitle={
            nome
              ? `Assinando como ${nome}`
              : 'Explorar é livre; assinar o que você cria pede um nome'
          }
          onPress={() => router.push('/entrar')}
        />
        {nome ? (
          <Row
            icon="x"
            title="Sair deste aparelho"
            subtitle="Apaga só o nome — suas memórias continuam aqui"
            onPress={sair}
          />
        ) : null}
        <Row
          icon="flag"
          title="Recomeçar como visitante"
          subtitle="Apaga tudo deste aparelho — para testar com outra pessoa"
          onPress={recomecarComoVisitante}
        />
        <Row
          icon="list"
          title="Minhas contribuições"
          subtitle={
            criadas.length === 0
              ? 'Você ainda não contou nenhuma'
              : `${criadas.length} memória${criadas.length > 1 ? 's' : ''}${emRevisao > 0 ? `, ${emRevisao} em revisão` : ''}`
          }
          onPress={() => router.push('/contribuicoes')}
        />
        <Row
          icon="accessibility"
          title="Acessibilidade"
          subtitle="Fontes grandes · modo simples"
          expanded={a11yOpen}
          onPress={() => setA11yOpen((v) => !v)}
        />

        {a11yOpen ? (
          <View style={styles.a11y}>
            <Toggle
              label="Fonte grande"
              hint="Aumenta todo o texto do app"
              value={largeText}
              onChange={toggleLargeText}
            />
            <Toggle
              label="Modo simples"
              hint="Desliga animações e aumenta o contraste"
              value={simpleMode}
              onChange={toggleSimpleMode}
            />
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Mono style={styles.statValue}>{value}</Mono>
      <Body style={styles.statLabel}>{label}</Body>
    </View>
  );
}

function Row({
  icon,
  title,
  subtitle,
  pill,
  expanded,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  pill?: string;
  expanded?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={onPress ? { expanded: !!expanded } : undefined}
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}>
      <Icon name={icon} size={22} color={colors.esmalte} />
      <View style={{ flex: 1 }}>
        <Body style={styles.rowTitle}>{title}</Body>
        {subtitle ? <Body style={styles.rowSubtitle}>{subtitle}</Body> : null}
      </View>
      {pill ? (
        <View style={styles.pill}>
          <Mono style={styles.pillText}>{pill}</Mono>
        </View>
      ) : (
        <Icon name={expanded ? 'chevronLeft' : 'chevronRight'} size={18} color={colors.grafiteDim} />
      )}
    </Pressable>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <View style={styles.toggle}>
      <View style={{ flex: 1 }}>
        <Body style={styles.toggleLabel}>{label}</Body>
        <Body style={styles.toggleHint}>{hint}</Body>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.cal3, true: colors.ferrugem }}
        thumbColor={value ? colors.ferrugemClara : colors.grafiteDim}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cal },

  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingHorizontal: space.xl,
    paddingVertical: space.gutter,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.esmalte,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
  },
  avatarText: { fontSize: 28, color: colors.sobreEsmalte },
  level: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.ferrugem,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.cal,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  levelText: { fontSize: 10, fontWeight: '700', color: colors.sobreFerrugem },
  name: { fontSize: 22 },
  tag: { fontSize: 12.5, letterSpacing: 0.3, color: colors.grafiteDim, marginTop: 4 },

  stats: { flexDirection: 'row', gap: 10, paddingHorizontal: space.xl },
  stat: {
    flex: 1,
    backgroundColor: colors.cal2,
    borderWidth: 1,
    borderColor: colors.calLine,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, color: colors.esmalte },
  statLabel: { fontSize: 11, color: colors.grafiteDim, marginTop: 3, textAlign: 'center' },

  badges: { paddingHorizontal: space.xl, paddingTop: space.xxl },
  sectionTitle: { fontSize: 17, marginBottom: space.md },
  badgeRow: { gap: space.md },
  badge: { width: 84, alignItems: 'center' },
  badgeIcon: {
    width: 66,
    height: 66,
    borderRadius: radius.md,
    backgroundColor: colors.cal2,
    borderWidth: 1,
    borderColor: colors.calLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIconOn: { backgroundColor: alpha.ferrugemTinta, borderColor: colors.ferrugem },
  badgeLabel: {
    fontSize: 10.5,
    lineHeight: 13,
    color: colors.grafiteDim,
    marginTop: 7,
    textAlign: 'center',
  },

  rows: { paddingHorizontal: space.xl, paddingTop: space.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: HIT + 12,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.calLine,
  },
  rowTitle: { fontSize: 14.5, fontWeight: '500', color: colors.grafite },
  rowSubtitle: { fontSize: 12, color: colors.grafiteDim, marginTop: 2 },
  pill: {
    backgroundColor: colors.ferrugem,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: { fontSize: 11, fontWeight: '700', color: colors.sobreFerrugem },

  a11y: {
    backgroundColor: colors.cal2,
    borderWidth: 1,
    borderColor: colors.calLine,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    marginTop: space.md,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: HIT + 12,
    paddingVertical: space.md,
  },
  toggleLabel: { fontSize: 14.5, fontWeight: '600', color: colors.grafite },
  toggleHint: { fontSize: 12, color: colors.grafiteDim, marginTop: 2 },
});
