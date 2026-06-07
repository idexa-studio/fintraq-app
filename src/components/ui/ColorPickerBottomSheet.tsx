import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  Platform,
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
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const bottomSheet = useBottomSheet();

  const handleSelect = useCallback(
    (hex: string) => {
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
            <MaterialCommunityIcons name="check-circle" size={20} color={item.hex} />
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

  const ItemSeparatorComponent = useCallback(
    () => <View style={styles.separator} />,
    [styles.separator],
  );

  const snapPoints = useMemo(() => ['75%'], []);

  return (
    <BentoBottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={snapPoints}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{palette.length} colors</Text>
          </View>
          <BentoPressable onPress={onClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={18} color={colors.text} />
          </BentoPressable>
        </View>

        <FlatList
          data={palette as ColorOption[]}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          ItemSeparatorComponent={ItemSeparatorComponent}
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

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('4'),
      paddingBottom: spacing('2'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontFamily: typography.fonts.heading,
      fontSize: 22,
      color: colors.text,
    },
    subtitle: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      marginTop: 2,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: radius('full'),
      backgroundColor: colors.text + '0C',
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContent: {
      paddingBottom: Platform.OS === 'ios' ? spacing('8') : spacing('6'),
    },
    separator: {
      height: 1,
      backgroundColor: colors.text + '0C',
      marginLeft: layout.screenPadding + 32 + spacing('3'),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      height: ITEM_HEIGHT,
      paddingHorizontal: layout.screenPadding,
      gap: spacing('3'),
    },
    rowSelected: {},
    swatch: {
      width: 32,
      height: 32,
      borderRadius: radius('full'),
      flexShrink: 0,
    },
    colorName: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      fontSize: 15,
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
