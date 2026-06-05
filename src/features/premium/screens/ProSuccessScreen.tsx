import { Header } from '@/src/components/ui/Header';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { FEATURES } from '@/src/constants/iap';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ProSuccessScreen = React.memo(function ProSuccessScreen() {
  const theme = useTheme();
  const { colors, typography, spacing } = theme;
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />
      <Header title="Keeep Pro" showBack />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={[styles.heroLabel, { fontFamily: typography.fonts.semibold, color: colors.primary }]}>Lifetime member</Text>
          <Text style={[styles.heroTitle, { fontFamily: typography.fonts.heading, color: colors.text }]}>You{"'"}re all set.</Text>
          <Text style={[styles.heroSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
            Every professional tool, every future update — yours forever. No subscriptions, no limits.
          </Text>
        </View>

        <SectionHeader title="Your pro tools" noPadding />

        <View style={styles.grid}>
          {FEATURES.map(f => (
            <View key={f.title} style={styles.tile}>
              <MaterialCommunityIcons name={f.icon} size={20} color={colors.primary} />
              <Text style={[styles.tileTitle, { fontFamily: typography.fonts.semibold, color: colors.text }]}>{f.title}</Text>
              <Text style={[styles.tileDesc, { fontFamily: typography.fonts.regular, color: colors.textMuted }]} numberOfLines={3}>{f.description}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: spacing('3') }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={[styles.btnText, { fontFamily: typography.fonts.bold, color: colors.background }]}>Open dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, sizes, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingHorizontal: layout.screenPadding },
    hero: { paddingTop: spacing('6'), paddingBottom: spacing('5'), gap: spacing('3') },
    heroLabel: { fontSize: typography.sizes.xs },
    heroTitle: { fontSize: typography.sizes.xxxl, lineHeight: 34 },
    heroSub: { fontSize: typography.sizes.sm, lineHeight: 20, opacity: 0.7 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing('2') },
    tile: { width: '47%', backgroundColor: colors.surface, borderRadius: radius('xl'), padding: spacing('3.5'), gap: spacing('2') },
    tileTitle: { fontSize: typography.sizes.sm },
    tileDesc: { fontSize: typography.sizes.xs, lineHeight: 17, opacity: 0.6 },
    btn: { height: sizes.button.lg.height, borderRadius: sizes.button.lg.borderRadius, backgroundColor: colors.text, justifyContent: 'center', alignItems: 'center' },
    btnText: { fontSize: sizes.button.lg.fontSize },
    footer: { paddingHorizontal: layout.screenPadding, paddingTop: spacing('4'), paddingBottom: Platform.OS === 'ios' ? spacing('8') : spacing('6'), backgroundColor: colors.background },
  });
