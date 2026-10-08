import { IconButton } from '@/design/components/IconButton';
import { Text } from '@/design/components/Text';
import React from 'react';
import { View } from 'react-native';

export type PeriodStepperProps = {
  /** The period shown, e.g. "October 2026". */
  label: string;
  onPrevious?: () => void;
  onNext?: () => void;
  /** No going past the present. */
  nextDisabled?: boolean;
  previousLabel?: string;
  nextLabel?: string;
};

/** Steps the period being looked at back and forward, with its name between the arrows. */
export function PeriodStepper({ label, onPrevious, onNext, nextDisabled = false, previousLabel = 'Previous period', nextLabel = 'Next period' }: PeriodStepperProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <IconButton icon="chevron-left" onPress={onPrevious} accessibilityLabel={previousLabel} />
      <Text variant="bodyStrong" accessibilityLiveRegion="polite">{label}</Text>
      <IconButton icon="chevron-right" onPress={onNext} disabled={nextDisabled} accessibilityLabel={nextLabel} />
    </View>
  );
}
