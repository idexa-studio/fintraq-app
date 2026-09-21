import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import {
  CheckmarkCircle01Icon,
  CloudIcon,
  ShieldKeyIcon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { alpha } from '@/src/theme/tokens';

export type CloudBackupChoice = 'enable' | 'skip';

type CloudBackupStepProps = {
  selectedChoice: CloudBackupChoice;
  onSelectChoice: (choice: CloudBackupChoice) => void;
  userEmail?: string | null;
  isConnecting?: boolean;
};

export const CloudBackupStep = React.memo(function CloudBackupStep({
  selectedChoice,
  onSelectChoice,
  userEmail,
  isConnecting,
}: CloudBackupStepProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors } = theme;
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const isEnable = selectedChoice === 'enable';
  const isSkip = selectedChoice === 'skip';

  return (
    <View style={styles.container}>
      {/* Option 1: Enable Google Drive Backup */}
      <BentoPressable
        style={[styles.card, isEnable && styles.cardActive]}
        onPress={() => onSelectChoice('enable')}
      >
        <IconAvatar
          icon={CloudIcon as IconSvgElement}
          color={isEnable ? colors.primary : colors.textMuted}
          variant="subtle"
          size={48}
          iconSize={22}
        />
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, isEnable && { color: colors.primary }]}>
              {t('onboarding.cloudTitle')}
            </Text>
            {isConnecting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <View style={styles.recBadge}>
                <Text style={styles.recBadgeText}>{t('onboarding.recommended')}</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>
            {isConnecting
              ? t('onboarding.connecting')
              : userEmail
              ? t('onboarding.connected', { email: userEmail })
              : t('onboarding.cloudDescription')}
          </Text>
        </View>
        <View style={styles.radio}>
          {isEnable && (
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color={colors.primary} />
          )}
        </View>
      </BentoPressable>

      {/* Option 2: Skip Cloud Backup */}
      <BentoPressable
        style={[styles.card, isSkip && styles.cardActive]}
        onPress={() => onSelectChoice('skip')}
      >
        <IconAvatar
          icon={ShieldKeyIcon as IconSvgElement}
          color={isSkip ? colors.primary : colors.textMuted}
          variant="subtle"
          size={48}
          iconSize={22}
        />
        <View style={styles.info}>
          <Text style={[styles.title, isSkip && { color: colors.primary }]}>
            {t('onboarding.offlineTitle')}
          </Text>
          <Text style={styles.subtitle}>
            {t('onboarding.offlineDescription')}
          </Text>
        </View>
        <View style={styles.radio}>
          {isSkip && (
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color={colors.primary} />
          )}
        </View>
      </BentoPressable>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      gap: spacing('3.5'),
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('4'),
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    cardActive: {
      borderColor: colors.primary,
      backgroundColor: alpha(colors.primary, 'faint'),
    },
    info: {
      flex: 1,
      flexShrink: 1,
      gap: spacing('1'),
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
      flexWrap: 'wrap',
    },
    title: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      fontSize: 15,
      color: colors.text,
    },
    recBadge: {
      backgroundColor: alpha(colors.primary, 'subtle'),
      paddingHorizontal: spacing('2'),
      paddingVertical: 2,
      borderRadius: radius('full'),
    },
    recBadgeText: {
      fontFamily: typography.fonts.bold,
      fontSize: 10,
      color: colors.primary,
    },
    subtitle: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.sm,
      color: colors.textMuted,
      lineHeight: 18,
    },
    radio: {
      width: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
