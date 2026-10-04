import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { Icon } from '@/src/components/ui/Icon';
import { Text } from '@/src/components/ui/Text';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { useTranslation } from 'react-i18next';

type Props = {
  name?: string;
  isPremium: boolean;
  onSearch: () => void;
};

function getGreetingKey() {
  const h = new Date().getHours();
  if (h < 12) return 'common.goodMorning';
  if (h < 17) return 'common.goodAfternoon';
  return 'common.goodEvening';
}

export const DashboardHeader = React.memo(function DashboardHeader({ name, isPremium, onSearch }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const monogram = useMemo(() => (name || 'F').charAt(0).toUpperCase(), [name]);
  const greetingKey = useMemo(() => getGreetingKey(), []);
  const greeting = t(greetingKey);
  const displayName = name?.split(' ')[0] ?? '';

  return (
    <View style={styles.container}>
      <View style={styles.greetingRow}>
        <View style={styles.greetingText}>
          <Text variant="callout" tone="muted">{greeting}{displayName ? ',' : ''}</Text>
          {displayName ? <Text variant="headline" numberOfLines={1}>{displayName}</Text> : null}
        </View>

        {/* Search + avatar in one widget: the whole thing opens search. */}
        <BentoPressable
          style={styles.searchWidget}
          onPress={onSearch}
          accessibilityRole="button"
          accessibilityLabel={t('search.placeholder')}
        >
          <Icon name="search-simple" size={18} color={colors.textMuted} />
          <View>
            <View style={styles.avatar}>
              <Text variant="label" color={colors.primaryInk}>{monogram}</Text>
            </View>
            {isPremium ? (
              <View style={styles.crownBadge}>
                <Icon name="crown" size={8} color={colors.onColor} />
              </View>
            ) : null}
          </View>
        </BentoPressable>
      </View>
    </View>
  );
});

const AVATAR = 32;

const createStyles = ({ colors, spacing, radius, layout, alpha }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('4'),
      paddingBottom: spacing('3'),
    },
    greetingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing('3'),
    },
    greetingText: { flexShrink: 1 },
    searchWidget: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
      backgroundColor: colors.surface,
      paddingLeft: spacing('3'),
      paddingRight: spacing('1.5'),
      paddingVertical: spacing('1.5'),
      borderRadius: radius('xl'),
    },
    avatar: {
      width: AVATAR,
      height: AVATAR,
      borderRadius: Math.round(AVATAR * 0.3),
      backgroundColor: alpha(colors.primary, 'subtle'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Cut-out ring in the widget colour so the crown reads as sitting on the corner.
    crownBadge: {
      position: 'absolute',
      right: -3,
      top: -3,
      width: 14,
      height: 14,
      borderRadius: radius('full'),
      backgroundColor: colors.warning,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.surface,
    },
  });
