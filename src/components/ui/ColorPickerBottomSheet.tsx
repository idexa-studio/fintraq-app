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

const ITEM_HEIGHT = 60;

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
          style={[styles.row, selected && styles.rowSelected]}
          onPress={() => handleSelect(item.hex)}
          scaleOnPress={false}
        >
          <View style={[styles.swatch, { backgroundColor: item.hex }]} />
          <Text style={[styles.colorName, selected && styles.colorNameSelected]}>
            {item.name}
          </Text>
          <Text style={styles.colorHex}>{item.hex.toUpperCase()}</Text>
          {selected && (
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color={item.hex} />
          )}
        </BentoPressable>
      );
    },
    [value, handleSelect, styles],
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
      width: 16,
      height: 16,
      borderRadius: radius('full'),
      marginLeft: spacing('3'),
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
      paddingBottom: spacing('3'),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 50,
      paddingHorizontal: layout.screenPadding,
      marginVertical: spacing('0.5'),
      gap: spacing('3'),
    },
    rowSelected: {
      backgroundColor: colors.primaryLight,
    },
    swatch: {
      width: 32,
      height: 32,
      borderRadius: radius('full'),
      flexShrink: 0,
    },
    colorName: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.md,
      color: colors.text,
    },
    colorNameSelected: {
      fontFamily: typography.fonts.semibold,
    },
    colorHex: {
      fontFamily: typography.fonts.amountRegular,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
  });
