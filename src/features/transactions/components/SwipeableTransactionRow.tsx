import React, { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityActionEvent, StyleSheet, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { BentoPressable, Icon } from '@/src/components/ui';
import type { TransactionListItem } from '@/src/features/transactions/api/transactions';
import { TransactionRow } from '@/src/features/transactions/components/TransactionRow';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { alpha } from '@/src/theme/tokens';

type SwipeableInstance = React.ComponentRef<typeof Swipeable>;

// Only one row may be open at a time across the list.
let openRow: SwipeableInstance | null = null;

type SwipeableTransactionRowProps = {
  tx: TransactionListItem;
  isFirst: boolean;
  isLast: boolean;
  onEdit: (tx: TransactionListItem) => void;
  onDelete: (tx: TransactionListItem) => void;
};

/**
 * Transaction row with swipe-left edit/delete. The same actions are exposed as accessibility
 * actions, since screen-reader users can't discover or perform the swipe.
 */
export const SwipeableTransactionRow = React.memo(function SwipeableTransactionRow({
  tx,
  isFirst,
  isLast,
  onEdit,
  onDelete,
}: SwipeableTransactionRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const swipeRef = useRef<SwipeableInstance>(null);

  const handleEdit = useCallback(() => {
    swipeRef.current?.close();
    onEdit(tx);
  }, [onEdit, tx]);

  const handleDelete = useCallback(() => {
    swipeRef.current?.close();
    onDelete(tx);
  }, [onDelete, tx]);

  const renderRightActions = useCallback(
    () => (
      <View style={styles.actions}>
        <BentoPressable style={styles.editAction} onPress={handleEdit} accessibilityRole="button" accessibilityLabel={t('common.edit')}>
          <Icon name="pencil-simple" size={18} color={theme.colors.primaryInk} />
        </BentoPressable>
        <BentoPressable style={styles.deleteAction} onPress={handleDelete} accessibilityRole="button" accessibilityLabel={t('common.delete')}>
          <Icon name="delete" size={18} color={theme.colors.danger} />
        </BentoPressable>
      </View>
    ),
    [styles, handleEdit, handleDelete, theme.colors, t],
  );

  const accessibilityActions = useMemo(
    () => [
      { name: 'edit', label: t('common.edit') },
      { name: 'delete', label: t('common.delete') },
    ],
    [t],
  );

  const onAccessibilityAction = useCallback(
    ({ nativeEvent }: AccessibilityActionEvent) => {
      if (nativeEvent.actionName === 'edit') handleEdit();
      else if (nativeEvent.actionName === 'delete') handleDelete();
    },
    [handleEdit, handleDelete],
  );

  const onWillOpen = useCallback(() => {
    if (openRow && openRow !== swipeRef.current) openRow.close();
    openRow = swipeRef.current;
  }, []);

  const onClose = useCallback(() => {
    if (openRow === swipeRef.current) openRow = null;
  }, []);

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      rightThreshold={30}
      friction={1.8}
      overshootRight={false}
      onSwipeableWillOpen={onWillOpen}
      onSwipeableClose={onClose}
    >
      <TransactionRow
        tx={tx}
        isFirst={isFirst}
        isLast={isLast}
        onPress={handleEdit}
        accessibilityActions={accessibilityActions}
        onAccessibilityAction={onAccessibilityAction}
      />
    </Swipeable>
  );
});

const createStyles = ({ colors, layout }: ThemeContextType) => {
  const action = { width: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center' } as const;
  return StyleSheet.create({
    actions: { flexDirection: 'row', width: layout.minTouchTarget * 2, alignItems: 'stretch', justifyContent: 'flex-end' },
    editAction: { ...action, backgroundColor: alpha(colors.primary, 'subtle') },
    deleteAction: { ...action, backgroundColor: alpha(colors.danger, 'subtle') },
  });
};
