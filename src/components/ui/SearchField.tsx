import { BentoPressable } from './BentoPressable';
import { Icon } from './Icon';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { StyleProp, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

type SearchFieldProps = Omit<TextInputProps, 'value' | 'onChangeText' | 'style'> & {
  value: string;
  onChangeText: (text: string) => void;
  /**
   * The layer the field sits on, so it always contrasts:
   * `surface` (sheets, cards) → page-tone fill; `page` → white fill.
   */
  on?: 'surface' | 'page';
  style?: StyleProp<ViewStyle>;
};

export const SearchField = React.memo(function SearchField({
  value,
  onChangeText,
  on = 'surface',
  placeholder,
  style,
  ...inputProps
}: SearchFieldProps) {
  const { colors, typography, spacing, radius, sizes, alpha } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing('2.5'),
          height: sizes.button.md.height,
          paddingHorizontal: spacing('3.5'),
          borderRadius: radius('full'),
          backgroundColor: on === 'surface' ? colors.background : colors.surface,
        },
        style,
      ]}
    >
      <Icon name="search" size={18} color={colors.textMuted} weight="bold" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={alpha(colors.textMuted, 'strong')}
        accessibilityLabel={placeholder}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="never"
        style={{ flex: 1, height: '100%', paddingVertical: 0, color: colors.text, fontFamily: typography.fonts.regular, ...typography.metrics.md }}
        {...inputProps}
      />
      {value.length > 0 ? (
        <BentoPressable
          onPress={() => onChangeText('')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('common.clear')}
          style={{ width: 22, height: 22, borderRadius: radius('full'), backgroundColor: alpha(colors.textMuted, 'medium'), alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="x" size={12} color={colors.surface} weight="bold" />
        </BentoPressable>
      ) : null}
    </View>
  );
});
