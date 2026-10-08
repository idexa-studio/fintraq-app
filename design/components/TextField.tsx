import { Icon } from '@/design/components/Icon';
import type { IconName } from '@/design/components/Icon';
import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useFocusOnArrival } from '@/design/components/useFocusOnArrival';
import { useFontScale, useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

export type TextFieldProps = Omit<TextInputProps, 'style' | 'autoFocus'> & {
  /** Sits inside the field before the value, as in "Amount: £5.00". Omit only for search. */
  label?: string;
  icon?: IconName;
  /** How to fix it. Turns the outline red. */
  error?: string;
  helper?: string;
  trailing?: React.ReactNode;
  /** Printed before the value and not editable, e.g. a currency symbol. */
  prefix?: string;
  /** The field opens a picker instead of the keyboard: it shows a value and is pressed like a button. */
  onPress?: () => void;
  /** Opens the keyboard once the screen has arrived. Use this, never `autoFocus`, which fires mid-arrival. */
  focusOnArrival?: boolean;
  /** Shows a cross that empties the field while it holds something. For search. */
  onClear?: () => void;
  clearLabel?: string;
  /**
   * With `maxLength`: counts down inside the field once the end is near, where it stays in view
   * above the keyboard. Receives the count and returns how to say it aloud, so the wording stays
   * with the screen's language.
   */
  remaining?: (left: number) => string;
};

/** How close to `maxLength` a value gets before the field starts counting down. */
const COUNT_DOWN_FROM = 20;

/** An outlined field with its label inside. */
export function TextField({ label, icon, error, helper, trailing, prefix, onPress, focusOnArrival = false, onClear, clearLabel = 'Clear', remaining, editable = true, onFocus, onBlur, ...rest }: TextFieldProps) {
  const { colors, type, border, space } = useTheme();
  const styles = useStyles(createStyles);
  const [focused, setFocused] = useState(false);
  const scale = useFontScale();
  const input = useFocusOnArrival(focusOnArrival);
  const outline = error ? colors.danger : !editable ? colors.disabled : colors.border;
  const thick = focused || !!error;
  const left = rest.maxLength == null ? null : rest.maxLength - (rest.value?.length ?? 0);
  // Nothing to say while there is plenty of room.
  const counting = !!remaining && left != null && left <= COUNT_DOWN_FROM;

  const field = (
      <View style={[styles.field, { borderColor: outline, borderWidth: thick ? border.thick : border.thin, paddingHorizontal: styles.field.paddingHorizontal - (thick ? border.thick : border.thin) }]}>
        {icon ? <Icon name={icon} size={styles.icon.width} color={editable ? colors.text : colors.onDisabled} /> : null}
        {label ? <Text variant="body" tone={editable ? 'default' : 'disabled'}>{`${label}:`}</Text> : null}
        {prefix ? <Text variant="body" tone={editable ? 'default' : 'disabled'} style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          {...rest}
          ref={input}
          editable={editable && !onPress}
          pointerEvents={onPress ? 'none' : undefined}
          allowFontScaling={false}
          accessibilityLabel={rest.accessibilityLabel ?? label}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.selected}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={[styles.input, { fontFamily: type.body.fontFamily, fontWeight: type.body.fontWeight, fontSize: type.body.fontSize * scale, color: editable ? colors.text : colors.onDisabled }]}
        />
        {onClear && rest.value ? (
          <Touchable onPress={onClear} accessibilityLabel={clearLabel} hitSlop={space.md}>
            <Icon name="x" size={styles.icon.width} color={colors.text} />
          </Touchable>
        ) : null}
        {counting ? <Text variant="caption" tone="muted" accessibilityLabel={remaining(left)}>{String(left)}</Text> : null}
        {trailing}
      </View>
  );

  return (
    <View style={styles.wrap}>
      {/* The outline thickens inside a fixed box so the content never shifts. */}
      {onPress ? <Touchable onPress={onPress} accessibilityLabel={`${label ?? ''} ${rest.value ?? ''}`.trim()}>{field}</Touchable> : field}
      {error ? <Text variant="caption" tone="danger">{error}</Text> : helper ? <Text variant="caption" tone="muted">{helper}</Text> : null}
    </View>
  );
}

const createStyles = ({ radius, size, space }: Theme) =>
  StyleSheet.create({
    wrap: { gap: space.xs + space.xxs, alignSelf: 'stretch' },
    field: { minHeight: size.field, borderRadius: radius.field, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg },
    input: { flex: 1, alignSelf: 'stretch', padding: 0, minWidth: 0 },
    icon: { width: size.iconSmall },
    // Sits tight against the value it belongs to.
    prefix: { marginRight: -space.sm },
  });
