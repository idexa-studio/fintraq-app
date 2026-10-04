import { Dialog } from './Dialog';
import type { IconSource } from './Icon';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

type ConfirmDialogProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button. Only for irreversible actions (delete, erase). */
  destructive?: boolean;
  /** Shows a spinner and blocks repeat taps while a previous confirm is still running. */
  isLoading?: boolean;
  /** Optional glyph before the title. None by default: the question and the button colour say enough. */
  icon?: IconSource;
};

/** Asks before doing something. Title is the question; the confirm label repeats the verb. */
export const ConfirmDialog = React.memo(function ConfirmDialog({
  visible,
  onClose,
  title,
  message,
  onConfirm,
  confirmLabel,
  cancelLabel,
  destructive = false,
  isLoading = false,
  icon,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  // Close first, then run — callers rely on the dialog dismissing itself.
  const handleConfirm = useCallback(() => {
    if (isLoading) return;
    onClose();
    void onConfirm();
  }, [isLoading, onClose, onConfirm]);

  return (
    <Dialog
      visible={visible}
      onClose={onClose}
      title={title}
      message={message}
      icon={icon}
      tone={destructive ? 'danger' : 'neutral'}
      dismissible={!isLoading}
      actions={[
        { label: cancelLabel ?? t('common.cancel'), variant: 'secondary', onPress: onClose, disabled: isLoading },
        { label: confirmLabel ?? t('common.confirm'), variant: destructive ? 'danger' : 'primary', onPress: handleConfirm, loading: isLoading },
      ]}
    />
  );
});
