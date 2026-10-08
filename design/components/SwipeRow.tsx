import { Icon } from '@/design/components/Icon';
import type { IconName } from '@/design/components/Icon';
import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

export type SwipeAction = {
  label: string;
  icon: IconName;
  /** danger for deleting; anything else is plain. */
  tone?: 'plain' | 'danger';
  onPress: () => void;
};

export type SwipeRowProps = {
  children: React.ReactNode;
  /** Shown when the row is swiped left, in this order. Two at most. */
  actions: SwipeAction[];
};

/**
 * A row with quick actions behind it, revealed by swiping. A shortcut only:
 * the same actions must also be reachable by opening the row, and are exposed
 * to screen readers as custom actions.
 */
export function SwipeRow({ children, actions }: SwipeRowProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const row = useRef<SwipeableMethods>(null);

  return (
    <Swipeable
      ref={row}
      friction={2}
      rightThreshold={styles.action.width / 2}
      overshootRight={false}
      renderRightActions={() => (
        <View style={styles.actions}>
          {actions.map((action) => {
            const danger = action.tone === 'danger';
            return (
              <Touchable
                key={action.label}
                onPress={() => { row.current?.close(); action.onPress(); }}
                accessibilityLabel={action.label}
                style={[styles.action, { backgroundColor: danger ? colors.danger : colors.action }]}
              >
                <Icon name={action.icon} color={danger ? colors.onDanger : colors.onAction} />
                <Text variant="tabActive" style={{ color: danger ? colors.onDanger : colors.onAction }}>{action.label}</Text>
              </Touchable>
            );
          })}
        </View>
      )}
    >
      <View
        style={{ backgroundColor: colors.surface }}
        accessibilityActions={actions.map((action) => ({ name: action.label, label: action.label }))}
        onAccessibilityAction={(e) => actions.find((action) => action.label === e.nativeEvent.actionName)?.onPress()}
      >
        {children}
      </View>
    </Swipeable>
  );
}

const createStyles = ({ size, space }: Theme) =>
  StyleSheet.create({
    actions: { flexDirection: 'row' },
    action: { width: size.row + space.lg, alignItems: 'center', justifyContent: 'center', gap: space.xs },
  });
