import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { Body, Mono, Plaque } from '@/components/Type';
import { formatCount, profile } from '@/data/profile';
import { useSettings } from '@/store/settings';
import { colors, HIT, radius, space, TABBAR_HEIGHT } from '@/theme';

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const [a11yOpen, setA11yOpen] = useState(false);

  const { largeText, simpleMode, toggleLargeText, toggleSimpleMode } = useSettings();

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
          <Plaque style={styles.avatarText}>{profile.initial}</Plaque>
          <View style={styles.level}>
            <Mono style={styles.levelText}>Nv {profile.level}</Mono>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Plaque style={styles.name}>{profile.name}</Plaque>
          <Mono style={styles.tag}>
            {profile.role} · {profile.city}
          </Mono>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat value={String(profile.stats.memories)} label="memórias" />
        <Stat value={formatCount(profile.stats.views)} label="visualizações" />
        <Stat value={String(profile.stats.collections)} label="coleções" />
      </View>

      <View style={styles.badges}>
        <Plaque style={styles.sectionTitle}>Conquistas</Plaque>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.badgeRow}>
          {profile.badges.map((badge) => (
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
          subtitle="Ajude a revisar novas memórias"
          pill={`${profile.moderationQueue} novas`}
        />
        <Row icon="list" title="Minhas contribuições" />
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
  badgeIconOn: { backgroundColor: 'rgba(247,200,119,0.12)', borderColor: colors.ferrugem },
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
