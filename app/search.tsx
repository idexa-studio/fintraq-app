import {
  ArrowLeft01Icon,
  Search01Icon,
  SparklesIcon,
  ReceiptTextIcon,
  Building01Icon,
  Tag01Icon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { SearchScreen } from '@/src/features/search/screens/SearchScreen';
import { usePremium } from '@/src/providers/PremiumProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

const SEARCH_FEATURES = [
  { icon: ReceiptTextIcon, label: 'Full-text search across all transactions' },
  { icon: Building01Icon, label: 'Find accounts by name instantly' },
  { icon: Tag01Icon, label: 'Locate categories across your history' },
];

const SearchGate = React.memo(function SearchGate() {
  const theme = useTheme();
  const { colors } = theme;
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <HugeiconsIcon icon={Search01Icon} size={36} color={colors.text} />
          <View style={styles.proBadge}>
            <HugeiconsIcon icon={SparklesIcon} size={12} color={colors.background} />
            <Text style={styles.proBadgeText}>Pro</Text>
          </View>
        </View>

        <Text style={styles.title}>Global Search</Text>
        <Text style={styles.subtitle}>
          Find anything across your entire financial history in one place.
        </Text>

        <View style={styles.featureList}>
          {SEARCH_FEATURES.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <HugeiconsIcon icon={f.icon} size={16} color={colors.text} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => router.push('/premium')}
          activeOpacity={0.85}
        >
          <HugeiconsIcon icon={SparklesIcon} size={16} color={colors.background} />
          <Text style={styles.ctaBtnText}>Upgrade to Pro</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6} style={styles.dismissBtn}>
          <Text style={styles.dismissText}>Not now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
});

export default React.memo(function SearchRoute() {
  const { isPremium } = usePremium();
  return isPremium ? <SearchScreen /> : <SearchGate />;
});

const createStyles = ({ colors, spacing, radius, typography }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: radius('md'),
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      margin: spacing('4'),
    },
    body: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing('8'),
      paddingBottom: 80,
      gap: spacing('4'),
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: radius('2xl'),
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing('2'),
    },
    proBadge: {
      position: 'absolute',
      bottom: -6,
      right: -6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 7,
      height: 20,
      borderRadius: radius('sm'),
      backgroundColor: colors.text,
    },
    proBadgeText: {
      fontFamily: typography.fonts.bold,
      fontSize: 9,
      color: colors.background,
    },
    title: {
      fontFamily: typography.fonts.heading,
      fontSize: 32,
      color: colors.text,
      letterSpacing: -1,
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: typography.fonts.regular,
      fontSize: 15,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 260,
    },
    featureList: {
      width: '100%',
      gap: spacing('2'),
      marginVertical: spacing('2'),
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
    },
    featureIcon: {
      width: 34,
      height: 34,
      borderRadius: radius('md'),
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureLabel: {
      fontFamily: typography.fonts.regular,
      fontSize: 14,
      color: colors.textMuted,
      flex: 1,
    },
    ctaBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing('2'),
      width: '100%',
      height: 52,
      borderRadius: radius('lg'),
      backgroundColor: colors.text,
      marginTop: spacing('2'),
    },
    ctaBtnText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 15,
      color: colors.background,
    },
    dismissBtn: {
      paddingVertical: spacing('2'),
    },
    dismissText: {
      fontFamily: typography.fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
    },
  });
