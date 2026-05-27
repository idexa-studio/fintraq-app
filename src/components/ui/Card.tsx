import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme, ThemeContextType } from '../../providers/ThemeProvider';
import { FrostLayer } from './FrostLayer';

type CardSize = 'sm' | 'md' | 'lg';
type CardVariant = 'default' | 'filled' | 'outlined';

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  size?: CardSize;
  variant?: CardVariant;
};

export const Card = React.memo(function Card({
  children,
  style,
  size = 'md',
  variant = 'default',
}: CardProps) {
  const theme = useTheme();
  const { colors, sizes } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const sizeConfig = sizes.card[size];

  const backgroundStyle = useMemo(() => {
    switch (variant) {
      case 'filled':
        return { backgroundColor: colors.surface };
      case 'outlined':
        return { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border };
      case 'default':
      default:
        return { backgroundColor: 'transparent' };
    }
  }, [variant, colors.surface, colors.border]);

  return (
    <View
      style={[
        styles.card,
        {
          padding: sizeConfig.padding,
          borderRadius: sizeConfig.borderRadius,
        },
        backgroundStyle,
        style,
      ]}
    >
      {variant === 'default' && (
        <FrostLayer intensity={25} borderRadius={sizeConfig.borderRadius} />
      )}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
});

const createStyles = ({ }: ThemeContextType) => StyleSheet.create({
  card: {
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
