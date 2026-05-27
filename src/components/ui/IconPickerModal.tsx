import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FrostLayer } from './FrostLayer';
import { useTheme, ThemeContextType } from '../../providers/ThemeProvider';
import { resolveIcon } from '../../utils/icons';
import type { IconGroup } from '../../constants/picker';

type Props = {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChange: (icon: string) => void;
  groups: IconGroup[];
  accentColor?: string;
  title?: string;
};

export const IconPickerModal = React.memo(function IconPickerModal({
  visible,
  onClose,
  value,
  onChange,
  groups,
  accentColor,
  title = 'Choose icon',
}: Props) {
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
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheet}>
          <FrostLayer intensity={85} />

          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Ionicons name="close" size={16} color={colors.text} />
            </TouchableOpacity>
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
                      <TouchableOpacity
                        key={icon}
                        style={[
                          styles.iconCell,
                          selected && {
                            backgroundColor: accent + '20',
                            borderColor: accent,
                          },
                        ]}
                        onPress={() => handleSelect(icon)}
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name={resolveIcon(icon, 'grid-outline')}
                          size={18}
                          color={selected ? accent : colors.textMuted}
                        />
                      </TouchableOpacity>
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
      flex: 1,
    },
    sheet: {
      maxHeight: '80%',
      borderTopLeftRadius: radius('2xl'),
      borderTopRightRadius: radius('2xl'),
      borderTopWidth: 1,
      borderColor: colors.text + '0C',
      overflow: 'hidden',
      backgroundColor: colors.background,
    },
    handle: {
      alignSelf: 'center',
      width: 42,
      height: 4,
      borderRadius: radius('full'),
      marginTop: spacing('2.5'),
      backgroundColor: colors.textMuted + '30',
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
      width: 32,
      height: 32,
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.text + '0C',
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: Platform.OS === 'ios' ? spacing('8') : spacing('6'),
      gap: spacing('5'),
    },
    group: {
      gap: spacing('2.5'),
    },
    groupLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
    },
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing('1.5'),
    },
    iconCell: {
      width: 42,
      height: 42,
      borderRadius: radius('lg'),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.text + '0C',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
