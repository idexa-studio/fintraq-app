import { Section, StepRow, useTheme } from '@/design';
import type { IconName } from '@/design';
import type { GettingStartedStep, GettingStartedStepId } from '@/features/home/getting-started';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

const ICONS: Record<GettingStartedStepId, IconName> = {
  account: 'wallet',
  transaction: 'receipt',
  insights: 'chart-pie',
  reminder: 'bell',
  secondAccount: 'coins-stack',
  backup: 'cloud-check',
};

type GettingStartedProps = {
  steps: readonly GettingStartedStep[];
  /** Opens the screen where the step is done. */
  onStep: (id: GettingStartedStepId) => void;
  onHide: () => void;
};

/** The first few things worth doing, as a journey: done ones ticked, the next one ready to tap. */
export function GettingStarted({ steps, onStep, onHide }: GettingStartedProps) {
  const { t } = useTranslation('home');
  const { space } = useTheme();
  const done = steps.filter((step) => step.state === 'done').length;
  return (
    <Section title={t('start.title')} hint={t('start.hint', { done, total: steps.length })} actionLabel={t('start.hide')} onAction={onHide}>
      <View style={{ gap: space.md }}>
        {steps.map((step) => (
          <StepRow key={step.id} icon={ICONS[step.id]} label={t(`start.steps.${step.id}`)} state={step.state} onPress={step.state === 'current' ? () => onStep(step.id) : undefined} />
        ))}
      </View>
    </Section>
  );
}
