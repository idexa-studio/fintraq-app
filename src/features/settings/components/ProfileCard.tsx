import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { BentoPressable, Icon, Text } from '@/src/components/ui';
import { CaretRightIcon, PencilSimpleIcon, SparkleIcon } from '@/src/components/ui/icons';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = {
  name: string;
  isPremium: boolean;
  onEditName: () => void;
  onOpenPremium: () => void;
};

/**
 * Who you are and what plan you're on, in the one ink card on the page. The top half renames;
 * the bottom strip opens Pro — an upgrade call for free users, a quiet status line for Pro.
 */
export const ProfileCard = React.memo(function ProfileCard({ name, isPremium, onEditName, onOpenPremium }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const monogram = (name || 'F').charAt(0).toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.ring} pointerEvents="none" />

      <BentoPressable style={styles.identity} onPress={onEditName} accessibilityRole="button" accessibilityLabel={t('settings.displayName')}>
        <View style={styles.avatar}>
          <Text variant="headline" tone="onPrimary">
            {monogram}
          </Text>
        </View>
        <View style={styles.identityText}>
          <Text variant="subheading" color={colors.onInk} numberOfLines={1}>
            {name || t('settings.welcome')}
          </Text>
          <Text variant="caption" color={colors.onInkMuted}>
            {isPremium ? t('settings.proMember') : t('settings.freeTier')}
          </Text>
        </View>
        <View style={styles.editChip}>
          <Icon icon={PencilSimpleIcon} size={16} color={colors.onInk} />
        </View>
      </BentoPressable>

      <BentoPressable
        style={styles.plan}
        onPress={onOpenPremium}
        accessibilityRole="button"
        accessibilityLabel={isPremium ? t('settings.proLifetime') : t('settings.upgradeToPro')}
      >
        <Icon icon={SparkleIcon} size={18} color={colors.warning} weight="bold" />
        <View style={styles.planText}>
          <Text variant="calloutStrong" color={colors.onInk} numberOfLines={1}>
            {isPremium ? t('settings.proLifetime') : t('settings.upgradeToPro')}
          </Text>
          <Text variant="caption" color={colors.onInkMuted} numberOfLines={1}>
            {isPremium ? t('settings.permanentAccess') : t('settings.unlockAllFeatures')}
          </Text>
        </View>
        {isPremium ? (
          <Icon icon={CaretRightIcon} size={16} color={colors.onInkMuted} />
        ) : (
          <View style={styles.upgradePill}>
            <Text variant="label" tone="onPrimary">
              {t('settings.upgrade')}
            </Text>
          </View>
        )}
      </BentoPressable>
    </View>
  );
});

const AVATAR = 52;
const RING = 180;

const createStyles = ({ colors, spacing, radius, alpha }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      borderRadius: radius('2xl'),
      backgroundColor: colors.tabBarBackground,
      padding: spacing('2'),
      gap: spacing('1'),
      overflow: 'hidden',
    },
    // Decorative ring in the brand colour, echoing the dashboard hero.
    ring: {
      position: 'absolute',
      width: RING,
      height: RING,
      borderRadius: radius('full'),
      borderWidth: 24,
      borderColor: alpha(colors.primary, 'subtle'),
      top: -RING * 0.5,
      right: -RING * 0.25,
    },
    identity: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('4'),
      padding: spacing('3'),
    },
    avatar: {
      width: AVATAR,
      height: AVATAR,
      borderRadius: Math.round(AVATAR * 0.3),
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    identityText: { flex: 1, gap: spacing('0.5') },
    editChip: {
      width: 36,
      height: 36,
      borderRadius: radius('full'),
      backgroundColor: alpha(colors.onInk, 'subtle'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    plan: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      paddingVertical: spacing('3'),
      paddingHorizontal: spacing('4'),
      borderRadius: radius('xl'),
      backgroundColor: alpha(colors.onInk, 'faint'),
    },
    planText: { flex: 1, gap: spacing('0.5') },
    upgradePill: {
      paddingHorizontal: spacing('3.5'),
      height: 32,
      justifyContent: 'center',
      borderRadius: radius('full'),
      backgroundColor: colors.primary,
    },
  });
