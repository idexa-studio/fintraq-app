import { Input } from '@/src/components/ui/Input';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';

type TextInputSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  title: string;
  subtitle?: string;
  initialValue?: string;
  placeholder?: string;
  saveLabel?: string;
  cancelLabel?: string;
  maxLength?: number;
  inputProps?: Omit<TextInputProps, 'value' | 'onChangeText' | 'placeholder' | 'maxLength'>;
};

export const TextInputSheet = React.memo(function TextInputSheet({
  visible,
  onClose,
  onSave,
  title,
  subtitle,
  initialValue = '',
  placeholder,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  maxLength,
  inputProps,
}: TextInputSheetProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors, typography } = theme;

  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  const handleSave = useCallback(() => {
    onSave(value.trim());
    onClose();
  }, [value, onSave, onClose]);

  const charsLeft = maxLength !== undefined ? maxLength - value.length : undefined;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

          <View style={styles.card}>
            <View style={styles.body}>
              <Text style={[styles.title, { fontFamily: typography.fonts.heading, color: colors.text }]}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={[styles.subtitle, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                  {subtitle}
                </Text>
              ) : null}

              <Input
                value={value}
                onChangeText={setValue}
                placeholder={placeholder}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSave}
                size="md"
                variant="default"
                maxLength={maxLength}
                {...inputProps}
              />

              {charsLeft !== undefined ? (
                <Text style={[styles.counter, { fontFamily: typography.fonts.regular, color: charsLeft <= 5 ? colors.danger : colors.textMuted }]}>
                  {charsLeft} remaining
                </Text>
              ) : null}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.btnCancel} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.btnCancelText}>
                  {cancelLabel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleSave} activeOpacity={0.7}>
                <Text style={styles.btnSaveText}>
                  {saveLabel}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const createStyles = ({ colors, overlay, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: overlay.dim,
      justifyContent: 'center',
      paddingHorizontal: layout.screenPadding,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 28,
      borderWidth: 0.5,
      borderColor: colors.text + '0C',
      overflow: 'hidden',
      padding: spacing('6'),
      gap: spacing('4'),
    },
    body: {
      padding: 0,
      gap: spacing('3'),
    },
    title: {
      fontSize: 24,
    },
    subtitle: {
      fontSize: typography.sizes.sm,
      opacity: 0.7,
    },
    counter: {
      fontSize: typography.sizes.xs,
      textAlign: 'right',
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing('2'),
      marginTop: spacing('2'),
    },
    btnCancel: {
      height: 40,
      paddingHorizontal: spacing('4'),
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: radius('full'),
    },
    btnCancelText: {
      fontSize: 14,
      fontFamily: typography.fonts.semibold,
      color: colors.primary,
    },
    btnSave: {
      height: 40,
      paddingHorizontal: spacing('5'),
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: radius('full'),
    },
    btnSaveText: {
      fontSize: 14,
      fontFamily: typography.fonts.semibold,
      color: colors.background,
    },
  });
