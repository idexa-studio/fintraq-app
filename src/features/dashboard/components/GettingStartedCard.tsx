import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { BentoPressable, Icon, IconButton, ProgressBar, Text } from '@/src/components/ui';
import type { IconName } from '@/src/components/ui';
import type { GettingStartedStep, GettingStartedStepId } from '@/src/features/dashboard/hooks/useGettingStarted';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = {
  steps: GettingStartedStep[];
  doneCount: number;
  onPressStep: (id: GettingStartedStepId) => void;
  onDismiss: () => void;
};

const STEP_ICON: Record<GettingStartedStepId, IconName> = {
  account: 'wallet',
  transaction: 'receipt',
  reminder: 'bell',
  secondAccount: 'bank',
  backup: 'cloud-arrow-up',
};

/**
 * First-run checklist under the hero: what to do next, in order, each one tap away. Done steps stay
 * listed (ticked) so progress is visible; the next open step is highlighted.
 */
export const GettingStartedCard = React.memo(function GettingStartedCard({ steps, doneCount, onPressStep, onDismiss }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const nextId = steps.find((s) => !s.done)?.id;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="subheading">{t('gettingStarted.title')}</Text>
          <Text variant="caption" tone="muted">{t('gettingStarted.progress', { done: doneCount, total: steps.length })}</Text>
        </View>
        <IconButton icon="x" variant="ghost" size="sm" onPress={onDismiss} accessibilityLabel={t('gettingStarted.dismiss')} />
      </View>
      <ProgressBar progress={(doneCount / steps.length) * 100} height={6} />

      <View style={styles.steps}>
        {steps.map((step) => {
          const isNext = step.id === nextId;
          return (
            <BentoPressable
              key={step.id}
              style={[styles.step, isNext && styles.stepNext]}
              onPress={() => onPressStep(step.id)}
              disabled={step.done}
              accessibilityRole="button"
              accessibilityState={{ checked: step.done, disabled: step.done }}
              accessibilityLabel={t(`gettingStarted.steps.${step.id}.title`)}
            >
              <View style={[styles.check, step.done ? styles.checkDone : isNext ? styles.checkNext : null]}>
                <Icon
                  name={step.done ? 'tick' : STEP_ICON[step.id]}
                  size={16}
                  color={step.done ? colors.primaryForeground : isNext ? colors.primaryInk : colors.textMuted}
                  weight="bold"
                />
              </View>
              <View style={styles.stepText}>
                <Text variant="bodyStrong" tone={step.done ? 'muted' : 'default'} style={step.done && styles.doneTitle} numberOfLines={1}>
                  {t(`gettingStarted.steps.${step.id}.title`)}
                </Text>
                {!step.done ? (
                  <Text variant="caption" tone="muted" numberOfLines={2}>
                    {t(`gettingStarted.steps.${step.id}.hint`)}
                  </Text>
                ) : null}
              </View>
              {!step.done ? <Icon name="chevron-right" size={14} color={colors.textMuted} weight="bold" /> : null}
            </BentoPressable>
          );
        })}
      </View>
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, layout, alpha }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      marginHorizontal: layout.screenPadding,
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
      padding: spacing('5'),
      gap: spacing('3'),
    },
    header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing('3') },
    headerText: { flex: 1, gap: 2 },
    steps: { gap: spacing('1'), marginTop: spacing('1') },
    step: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      paddingVertical: spacing('2.5'),
      paddingHorizontal: spacing('2.5'),
      marginHorizontal: -spacing('2.5'),
      borderRadius: radius('lg'),
    },
    stepNext: { backgroundColor: alpha(colors.primary, 'faint') },
    stepText: { flex: 1, gap: 2 },
    doneTitle: { textDecorationLine: 'line-through' },
    check: {
      width: 32,
      height: 32,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
    },
    checkNext: { backgroundColor: colors.primaryLight },
    checkDone: { backgroundColor: colors.primary },
  });
