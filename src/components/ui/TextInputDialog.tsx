import { Dialog } from './Dialog';
import { Input } from './Input';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInputProps } from 'react-native';

type TextInputDialogProps = {
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

/** Edit one short value (rename). Save is disabled until there is something to save. */
export const TextInputDialog = React.memo(function TextInputDialog({
  visible,
  onClose,
  onSave,
  title,
  subtitle,
  initialValue = '',
  placeholder,
  saveLabel,
  cancelLabel,
  maxLength,
  inputProps,
}: TextInputDialogProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  const canSave = value.trim().length > 0;

  const handleSave = useCallback(() => {
    if (!value.trim()) return;
    onSave(value.trim());
    onClose();
  }, [value, onSave, onClose]);

  const charsLeft = maxLength !== undefined ? maxLength - value.length : undefined;

  return (
    <Dialog
      visible={visible}
      onClose={onClose}
      title={title}
      message={subtitle}
      actions={[
        { label: cancelLabel ?? t('common.cancel'), variant: 'secondary', onPress: onClose },
        { label: saveLabel ?? t('common.save'), variant: 'primary', onPress: handleSave, disabled: !canSave },
      ]}
    >
      <Input
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={handleSave}
        maxLength={maxLength}
        helperText={charsLeft !== undefined && charsLeft <= 10 ? t('ui.charsLeft', { count: charsLeft }) : undefined}
        {...inputProps}
      />
    </Dialog>
  );
});
