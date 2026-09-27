import { Divider } from './Divider';
import { LIST_ITEM_LEADING_SIZE } from './ListItem';
import { Text } from './Text';
import { useTheme } from '@/src/providers/ThemeProvider';
import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

type ListGroupProps = {
  /** Section label rendered above the group. */
  title?: string;
  /** Helper text rendered below the group. */
  footer?: string;
  /** Indent dividers under the text column. Turn off for rows without a leading icon. */
  insetDividers?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Rounded container for ListItems — the iOS "inset grouped" pattern.
 * Inserts hairline dividers between children automatically.
 */
export const ListGroup = React.memo(function ListGroup({
  title,
  footer,
  insetDividers = true,
  children,
  style,
}: ListGroupProps) {
  const { colors, spacing, radius } = useTheme();
  const items = React.Children.toArray(children).filter(React.isValidElement);
  const inset = insetDividers ? spacing('4') + LIST_ITEM_LEADING_SIZE + spacing('3.5') : spacing('4');

  return (
    <View style={style}>
      {title ? (
        <Text variant="label" tone="muted" style={{ marginBottom: spacing('2'), marginLeft: spacing('1') }}>
          {title}
        </Text>
      ) : null}
      <View style={{ borderRadius: radius('xl'), overflow: 'hidden' }}>
        {items.map((child, i) => (
          <React.Fragment key={child.key ?? i}>
            {i > 0 ? (
              <View style={{ backgroundColor: colors.surface }}>
                <Divider inset={inset} />
              </View>
            ) : null}
            {child}
          </React.Fragment>
        ))}
      </View>
      {footer ? (
        <Text variant="caption" tone="muted" style={{ marginTop: spacing('2'), marginHorizontal: spacing('1') }}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
});
