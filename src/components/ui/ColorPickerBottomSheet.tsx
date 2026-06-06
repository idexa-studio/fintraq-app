import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme, ThemeContextType } from '../../providers/ThemeProvider';
import type { ColorOption } from '../../constants/picker';

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
        <TouchableOpacity
          style={[styles.row, selected && styles.rowSelected]}
          onPress={() => handleSelect(item.hex)}
          activeOpacity={0.85}
        >
          <View style={[styles.swatch, { backgroundColor: item.hex }]} />
          <Text style={[styles.colorName, selected && styles.colorNameSelected]}>
            {item.name}
          </Text>
          <Text style={styles.colorHex}>{item.hex.toUpperCase()}</Text>
          {selected && (
            <MaterialCommunityIcons name="check-circle" size={20} color={item.hex} />
          )}
        </TouchableOpacity>
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{palette.length} colors</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <MaterialCommunityIcons name="close" size={16} color={colors.text} />
            </TouchableOpacity>
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
          />
        </View>
      </View>
    </Modal>
  );
});

const createStyles = ({ colors, typography, spacing, radius, overlay, layout }: ThemeContextType) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: overlay.dim,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    sheet: {
      height: '75%',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    handle: {
      alignSelf: 'center',
      width: 32,
      height: 4,
      borderRadius: radius('full'),
      marginTop: spacing('3'),
      backgroundColor: colors.text + '24',
    },
    header: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('3'),
      paddingBottom: spacing('3'),
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
      backgroundColor: colors.surface,
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
