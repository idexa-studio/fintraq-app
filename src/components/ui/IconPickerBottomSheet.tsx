import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { IconGroup } from '../../constants/picker';
import { ThemeContextType, useTheme } from '../../providers/ThemeProvider';
import { resolveIcon } from '../../utils/icons';
import { BentoPressable } from './BentoPressable';

type IconPickerBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChange: (icon: string) => void;
  groups: IconGroup[];
  accentColor?: string;
  title?: string;
};

const CELL_SIZE = 38;

export const IconPickerBottomSheet = React.memo(function IconPickerBottomSheet({
  visible,
  onClose,
  value,
  onChange,
  groups,
  accentColor,
  title = 'Choose icon',
}: IconPickerBottomSheetProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const accent = accentColor ?? colors.primary;

  const handleSelect = useCallback(
    (icon: string) => {
      onChange(icon);
      onClose();
    },
    [onChange, onClose],
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <BentoPressable onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={18} color={colors.text} />
            </BentoPressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {groups.map((group) => (
              <View key={group.label} style={styles.group}>
                <Text style={styles.groupLabel}>{group.label}</Text>
                <View style={styles.iconGrid}>
                  {group.icons.map((icon) => {
                    const selected = value === icon;
                    return (
                      <BentoPressable
                        key={icon}
                        style={[styles.iconCell, selected && styles.iconCellSelected]}
                        onPress={() => handleSelect(icon)}
                        scaleOnPress={true}
                      >
                        <View style={[styles.iconCircle, selected && { backgroundColor: accent }]}>
                          <MaterialCommunityIcons
                            name={resolveIcon(icon, 'grid')}
                            size={selected ? 19 : 18}
                            color={selected ? colors.background : colors.text}
                          />
                        </View>
                      </BentoPressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
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
      maxHeight: '80%',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('3'),
      paddingBottom: spacing('3'),
    },
    title: {
      fontFamily: typography.fonts.heading,
      fontSize: 22,
      color: colors.text,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: Platform.OS === 'ios' ? spacing('8') : spacing('6'),
      gap: spacing('4'),
    },
    group: {
      gap: spacing('2'),
    },
    groupLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: 12,
      color: colors.textMuted,
      paddingLeft: spacing('1'),
      opacity: 0.7,
    },
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing('2.5'),
    },
    iconCell: {
      width: CELL_SIZE,
      height: CELL_SIZE,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconCircle: {
      width: CELL_SIZE,
      height: CELL_SIZE,
      borderRadius: radius('full'),
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    iconCellSelected: {},
  });
