import { Dialog, DialogAction, DialogTone } from './Dialog';
import { CheckCircleIcon, InfoIcon, WarningCircleIcon, WarningIcon } from './icons';
import React from 'react';
import { useTranslation } from 'react-i18next';

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type AlertDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onClose: () => void;
  type?: 'info' | 'success' | 'error' | 'warning';
};

const TONE: Record<NonNullable<AlertDialogProps['type']>, { tone: DialogTone; icon: typeof InfoIcon }> = {
  info: { tone: 'info', icon: InfoIcon },
  success: { tone: 'success', icon: CheckCircleIcon },
  warning: { tone: 'warning', icon: WarningIcon },
  error: { tone: 'danger', icon: WarningCircleIcon },
};

/** Tells the user the outcome of something they did. Every button closes the dialog. */
export const AlertDialog = React.memo(function AlertDialog({
  visible,
  title,
  message,
  buttons,
  onClose,
  type = 'info',
}: AlertDialogProps) {
  const { t } = useTranslation();
  const list = buttons?.length ? buttons : [{ text: t('common.ok') }];

  // Cancel-style buttons first so the recommended action ends up last (right / bottom).
  const ordered = [...list].sort((a, b) => Number(b.style === 'cancel') - Number(a.style === 'cancel'));
  const actions: DialogAction[] = ordered.map((b) => ({
    label: b.text,
    variant: b.style === 'destructive' ? 'danger' : b.style === 'cancel' ? 'secondary' : 'primary',
    onPress: () => {
      onClose();
      b.onPress?.();
    },
  }));

  return (
    <Dialog
      visible={visible}
      onClose={onClose}
      title={title}
      message={message}
      icon={TONE[type].icon}
      tone={TONE[type].tone}
      actions={actions}
    />
  );
});
