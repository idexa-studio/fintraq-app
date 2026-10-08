import { Icon } from '@/design/components/Icon';
import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type ChoiceProps = {
  label: string;
  selected: boolean;
  onPress?: () => void;
  disabled?: boolean;
};

/** One of several exclusive answers. */
export function Radio({ label, selected, onPress, disabled = false }: ChoiceProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const ink = disabled ? colors.onDisabled : colors.border;
  return (
    <Touchable onPress={onPress} disabled={disabled} accessibilityRole="radio" accessibilityState={{ selected, disabled }} accessibilityLabel={label} style={styles.row}>
      <View style={[styles.radio, { borderColor: ink }]}>
        {selected ? <View style={[styles.dot, { backgroundColor: ink }]} /> : null}
      </View>
      <Text variant="lead" tone={disabled ? 'disabled' : 'default'} style={styles.label}>{label}</Text>
    </Touchable>
  );
}

/** One of several answers that can be combined, or a single thing to agree to. */
export function Checkbox({ label, selected, onPress, disabled = false }: ChoiceProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const ink = disabled ? colors.onDisabled : colors.border;
  return (
    <Touchable onPress={onPress} disabled={disabled} accessibilityRole="checkbox" accessibilityState={{ checked: selected, disabled }} accessibilityLabel={label} style={styles.row}>
      <View style={[styles.box, { borderColor: ink }, selected ? { backgroundColor: ink } : null]}>
        {selected ? <Icon name="tick" size={styles.box.width * 0.7} color={colors.onAction} /> : null}
      </View>
      <Text variant="lead" tone={disabled ? 'disabled' : 'default'} style={styles.label}>{label}</Text>
    </Touchable>
  );
}

const createStyles = ({ colors, size, space, border, radius }: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: space.lg, minHeight: size.minTouch, paddingVertical: space.sm },
    label: { flex: 1 },
    radio: { width: size.radio, height: size.radio, borderRadius: size.radio / 2, borderWidth: border.thin, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    dot: { width: size.radio / 3, height: size.radio / 3, borderRadius: size.radio / 6 },
    box: { width: size.checkbox, height: size.checkbox, borderRadius: radius.sm / 2, borderWidth: border.thin, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  });
