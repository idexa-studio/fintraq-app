import { Dialog, DialogAction, DialogTone } from './Dialog';
import type { IconName } from './Icon';
import React from 'react';
import { useTranslation } from 'react-i18next';

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export type AlertDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onClose: () => void;
  type?: 'info' | 'success' | 'error' | 'warning';
};

const TONE: Record<NonNullable<AlertDialogProps['type']>, { tone: DialogTone; icon?: IconName }> = {
  // Plain info needs no glyph; outcomes get a small one so success and failure read at a glance.
  info: { tone: 'info' },
  success: { tone: 'success', icon: 'check-circle' },
  warning: { tone: 'warning', icon: 'warning' },
  error: { tone: 'danger', icon: 'warning-circle' },
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
