import { BentoPressable } from './BentoPressable';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
import type { IconSource } from './Icon';
import { Text } from './Text';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

export type OptionsDialogOption = {
  key: string;
  label: string;
  icon?: IconSource;
  selected?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  hint?: string;
  closeOnPress?: boolean;
  onPress: () => void;
};

type OptionsDialogProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  options: OptionsDialogOption[];
  cancelLabel?: string;
};

/** 2–5 choices in a dialog. One tap picks and closes. */
export const OptionsDialog = React.memo(function OptionsDialog({
  visible,
  onClose,
  title,
  subtitle,
  options,
  cancelLabel,
}: OptionsDialogProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors, alpha } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handlePress = useCallback((option: OptionsDialogOption) => {
    Haptics.selectionAsync().catch(() => {});
    if (option.closeOnPress !== false) onClose();
    option.onPress();
  }, [onClose]);

  return (
    <Dialog
      visible={visible}
      onClose={onClose}
      title={title ?? ''}
      message={subtitle}
      actions={[{ label: cancelLabel ?? t('common.cancel'), variant: 'secondary', onPress: onClose }]}
    >
      <View style={styles.list} accessibilityRole="radiogroup">
        {options.map((opt) => {
          const selected = !!opt.selected;
          const tint = opt.destructive ? colors.danger : selected ? colors.primaryInk : colors.text;
          return (
            <BentoPressable
              key={opt.key}
              onPress={() => handlePress(opt)}
              disabled={opt.disabled}
              scaleOnPress={false}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled: opt.disabled }}
              style={[
                styles.option,
                { backgroundColor: selected ? alpha(colors.primary, 'subtle') : colors.background },
                opt.disabled && styles.disabled,
              ]}
            >
              {opt.icon ? <Icon name={opt.icon} size={20} color={tint} /> : null}
              <View style={styles.optionText}>
                <Text variant="bodyStrong" color={tint}>{opt.label}</Text>
                {opt.hint ? <Text variant="caption" tone="muted">{opt.hint}</Text> : null}
              </View>
              {selected ? <Icon name="check-circle" size={20} color={colors.primaryInk} weight="fill" /> : null}
            </BentoPressable>
          );
        })}
      </View>
    </Dialog>
  );
});

const createStyles = ({ spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    list: { gap: spacing('2') },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      minHeight: 52,
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('2.5'),
      borderRadius: radius('lg'),
    },
    optionText: { flex: 1, gap: 2 },
    disabled: { opacity: 0.45 },
  });
