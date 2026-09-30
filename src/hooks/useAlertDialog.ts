import { useCallback, useMemo, useState } from 'react';
import type { AlertDialogProps } from '@/src/components/ui';

export type AlertOptions = Pick<AlertDialogProps, 'title' | 'message' | 'type' | 'buttons'>;

/**
 * State for a single <AlertDialog>: `showAlert(options)` opens it, and `alertProps` spreads
 * straight onto the dialog. Replaces the per-screen visible/title/message/buttons useState.
 */
export function useAlertDialog() {
  const [options, setOptions] = useState<AlertOptions>({ title: '' });
  const [visible, setVisible] = useState(false);

  const showAlert = useCallback((next: AlertOptions) => {
    setOptions(next);
    setVisible(true);
  }, []);
  const hideAlert = useCallback(() => setVisible(false), []);

  const alertProps: AlertDialogProps = useMemo(
    () => ({ ...options, visible, onClose: hideAlert }),
    [options, visible, hideAlert],
  );

  return { showAlert, hideAlert, alertProps };
}
