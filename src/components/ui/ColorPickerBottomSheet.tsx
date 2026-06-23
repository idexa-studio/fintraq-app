import { CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme, ThemeContextType } from '../../providers/ThemeProvider';
import type { ColorOption } from '../../constants/picker';
import { BentoPressable } from './BentoPressable';
import { BentoBottomSheet, useBottomSheet } from './BottomSheet';

const ITEM_HEIGHT = 62; // 56px row + 6px gap

type ColorPickerBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChange: (hex: string) => void;
  palette: readonly ColorOption[];
  title?: string;
};

export const ColorPickerBottomSheet = React.memo(function ColorPickerBottomSheet({
  visible,
  onClose,
  value,
  onChange,
  palette,
  title = 'Choose color',
}: ColorPickerBottomSheetProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const bottomSheet = useBottomSheet();

  const handleSelect = useCallback(
    (hex: string) => {
      Haptics.selectionAsync().catch(() => {});
      onChange(hex);
      onClose();
    },
    [onChange, onClose],
  );

  const renderItem = useCallback(
    ({ item }: { item: ColorOption }) => {
      const selected = value.toUpperCase() === item.hex.toUpperCase();
      return (
        <BentoPressable
          style={[
            styles.row,
            selected
              ? { backgroundColor: colors.surface, borderColor: item.hex + '50', borderWidth: 1 }
              : { backgroundColor: 'transparent', borderColor: 'transparent', borderWidth: 1 },
          ]}
          onPress={() => handleSelect(item.hex)}
          scaleOnPress={false}
        >
          <View style={[styles.swatch, { backgroundColor: item.hex }]}>
            {selected && (
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color='#fff' />
            )}
          </View>
          <Text style={[styles.colorName, selected && styles.colorNameSelected]}>
            {item.name}
          </Text>
          <Text style={[styles.colorHex, selected && { color: item.hex }]}>{item.hex.toUpperCase()}</Text>
        </BentoPressable>
      );
    },
    [value, handleSelect, styles, colors],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<ColorOption> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  const keyExtractor = useCallback((item: ColorOption) => item.hex, []);



  const snapPoints = useMemo(() => ['75%'], []);

  return (
    <BentoBottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={snapPoints}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{palette.length} colors</Text>
            </View>
            <View style={[styles.headerColorDot, { backgroundColor: value }]} />
          </View>
        </View>

        <FlatList
          data={palette as ColorOption[]}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews
          onScroll={bottomSheet?.onScroll}
          scrollEventThrottle={16}
        />
      </View>
    </BentoBottomSheet>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout, isDark }: ThemeContextType) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('4'),
      paddingBottom: spacing('2'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitleRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerColorDot: {
      width: 28,
      height: 28,
      borderRadius: radius('full'),
      marginLeft: spacing('3'),
      borderWidth: 2,
      borderColor: colors.border,
    },
    title: {
      fontFamily: typography.fonts.heading,
      fontSize: typography.sizes.xl,
      color: colors.text,
    },
    subtitle: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      marginTop: 2,
    },
    listContent: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: spacing('3'),
      gap: spacing('1.5'),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 56,
      paddingHorizontal: spacing('3'),
      borderRadius: radius('lg'),
      gap: spacing('3'),
    },
    swatch: {
      width: 36,
      height: 36,
      borderRadius: radius('full'),
      flexShrink: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorName: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.md,
      color: colors.text,
    },
    colorNameSelected: {
      fontFamily: typography.styles.chipLabelActive.fontFamily,
    },
    colorHex: {
      fontFamily: typography.fonts.amountRegular,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
  });
