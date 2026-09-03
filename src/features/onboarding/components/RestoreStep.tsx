import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import {
  CheckmarkCircle01Icon,
  CloudIcon,
  SparklesIcon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';

export type SetupOption = 'fresh' | 'restore';

type RestoreStepProps = {
  selectedOption: SetupOption;
  onSelectOption: (option: SetupOption) => void;
  userEmail?: string | null;
};

export const RestoreStep = React.memo(function RestoreStep({
  selectedOption,
  onSelectOption,
  userEmail,
}: RestoreStepProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const isFresh = selectedOption === 'fresh';
  const isRestore = selectedOption === 'restore';

  return (
    <View style={styles.container}>
      {/* Option 1: Start Fresh */}
      <BentoPressable
        style={[styles.card, isFresh && styles.cardActive]}
        onPress={() => onSelectOption('fresh')}
      >
        <IconAvatar
          icon={SparklesIcon as IconSvgElement}
          color={isFresh ? colors.primary : colors.textMuted}
          variant="subtle"
          size={48}
          iconSize={22}
        />
        <View style={styles.info}>
          <Text style={[styles.title, isFresh && { color: colors.primary }]}>
            Start fresh
          </Text>
          <Text style={styles.subtitle}>
            Set up your profile, default currency, and cash account.
          </Text>
        </View>
        <View style={styles.radio}>
          {isFresh && (
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color={colors.primary} />
          )}
        </View>
      </BentoPressable>

      {/* Option 2: Restore Backup */}
      <BentoPressable
        style={[styles.card, isRestore && styles.cardActive]}
        onPress={() => onSelectOption('restore')}
      >
        <IconAvatar
          icon={CloudIcon as IconSvgElement}
          color={isRestore ? colors.primary : colors.textMuted}
          variant="subtle"
          size={48}
          iconSize={22}
        />
        <View style={styles.info}>
          <Text style={[styles.title, isRestore && { color: colors.primary }]}>
            Restore from Cloud
          </Text>
          <Text style={styles.subtitle}>
            {userEmail
              ? `Connected as ${userEmail}. Ready to download your cloud backup.`
              : 'Connect your cloud account to restore existing accounts & transactions.'}
          </Text>
        </View>
        <View style={styles.radio}>
          {isRestore && (
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
      backgroundColor: colors.primary + '0A',
    },
    info: {
      flex: 1,
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
      backgroundColor: colors.primary + '18',
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
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
      lineHeight: 18,
    },
    radio: {
      width: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    restoreActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing('2.5'),
      height: 48,
      backgroundColor: colors.primary,
      borderRadius: radius('xl'),
      marginTop: spacing('2'),
    },
    restoreActionButtonText: {
      fontFamily: typography.styles.buttonLabel.fontFamily,
      fontSize: typography.sizes.md,
      color: colors.primaryForeground,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
  });
