import { GalleryGroup, Specimen, SpecimenRow } from '@/src/features/design-gallery/components/Specimen';
import { Text, Icon } from '@/src/components/ui';
import { useTheme } from '@/src/providers/ThemeProvider';
import type { ThemePalette } from '@/src/theme/colors';
import { ALPHA, AlphaToken, RADIUS, RadiusToken, SPACING, SpacingToken } from '@/src/theme/tokens';
import { TEXT_VARIANTS, TextVariant } from '@/src/theme/typography';
import { HUGEICONS } from '@/src/components/ui/icon-registry';
import type { IconName } from '@/src/components/ui/icon-registry';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const ICON_NAMES = Object.keys(HUGEICONS) as IconName[];

const COLOR_ROLES: { key: keyof ThemePalette; role: string }[] = [
  { key: 'background', role: 'Page background — lowest layer' },
  { key: 'surface', role: 'Cards, list groups, sheets' },
  { key: 'card', role: 'Inset fill inside a surface — tracks, chips' },
  { key: 'tabBarBackground', role: 'Floating tab bar' },
  { key: 'primary', role: 'Brand — main action, active state' },
  { key: 'primaryLight', role: 'Primary tint wash' },
  { key: 'primaryDark', role: 'Primary pressed / depth' },
  { key: 'primaryInk', role: 'Green text & icons on light layers (links, active labels)' },
  { key: 'primaryForeground', role: 'Text & icons on primary' },
  { key: 'text', role: 'Primary text & icons' },
  { key: 'textMuted', role: 'Secondary text, placeholders' },
  { key: 'border', role: 'Hairline edges on surfaces & controls' },
  { key: 'success', role: 'Income, positive, completed' },
  { key: 'danger', role: 'Expense, destructive, errors' },
  { key: 'warning', role: 'Caution, due soon' },
  { key: 'info', role: 'Transfers, informational' },
];

const TYPE_USAGE: Record<TextVariant, string> = {
  display: 'Hero numbers, onboarding',
  title: 'Screen titles',
  headline: 'Dialog & sheet titles',
  subheading: 'Card titles',
  body: 'Default reading text',
  bodyStrong: 'Row labels',
  callout: 'Descriptions',
  calloutStrong: 'Compact labels, links',
  caption: 'Metadata, helper text',
  label: 'Section labels',
  micro: 'Badges, counters',
  amountHero: 'Hero balance',
  amountLarge: 'Card totals',
  amount: 'Row amounts',
};

export function FoundationsSection() {
  const { colors, spacing, radius, alpha, heroCard, layout } = useTheme();

  return (
    <View style={{ gap: spacing('9') }}>
      <GalleryGroup title="Color">
        <Specimen
          title="Palette"
          description="Semantic roles from src/theme/colors.ts. Always read colours through useTheme().colors — never hard-code hex."
          guidelines={[
            'Layering: background → surface → card. Each step sits one level closer to the user.',
            'success/danger carry meaning (money in / money out). Never use them decoratively.',
            'User-chosen colours (accounts, categories) come from data and go through the color prop.',
          ]}
        >
          {COLOR_ROLES.map(({ key, role }) => (
            <View key={key} style={styles.swatchRow}>
              <View style={[styles.swatch, { backgroundColor: colors[key], borderRadius: radius('md'), borderColor: alpha(colors.text, 'subtle') }]} />
              <View style={{ flex: 1 }}>
                <Text variant="calloutStrong">{key}</Text>
                <Text variant="caption" tone="muted">{role}</Text>
              </View>
              <Text variant="caption" tone="muted">{colors[key]}</Text>
            </View>
          ))}
        </Specimen>

        <Specimen
          title="Alpha scale"
          description="alpha(color, level) tints any solid colour. Use named levels instead of hand-written hex suffixes."
        >
          {(Object.keys(ALPHA) as AlphaToken[]).map((level) => (
            <View key={level} style={styles.swatchRow}>
              <View style={[styles.swatch, { backgroundColor: alpha(colors.primary, level), borderRadius: radius('md'), borderColor: 'transparent' }]} />
              <View style={[styles.swatch, { backgroundColor: alpha(colors.danger, level), borderRadius: radius('md'), borderColor: 'transparent' }]} />
              <View style={{ flex: 1 }}>
                <Text variant="calloutStrong">{level}</Text>
                <Text variant="caption" tone="muted">{`${Math.round((parseInt(ALPHA[level], 16) / 255) * 100)}%`}</Text>
              </View>
            </View>
          ))}
        </Specimen>

        <Specimen title="Hero palette" description="Monochrome hero colours, read via useTheme().heroCard: text, ink discs with onInk glyphs, frosted tiles.">
          <View style={{ backgroundColor: heroCard.background, borderRadius: radius('2xl'), padding: spacing('5'), gap: spacing('2') }}>
            <Text variant="label" color={heroCard.textMuted}>BALANCE</Text>
            <Text variant="amountHero" color={heroCard.textPrimary}>$12,480.00</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing('2') }}>
              <View style={{ width: 40, height: 40, borderRadius: radius('full'), backgroundColor: heroCard.ink, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="arrow-up-right" size={18} color={heroCard.onInk} weight="bold" />
              </View>
              <View style={{ paddingHorizontal: spacing('3'), height: 28, justifyContent: 'center', borderRadius: radius('full'), backgroundColor: heroCard.tile }}>
                <Text variant="label" color={heroCard.textPrimary}>+ $4,200 this month</Text>
              </View>
            </View>
          </View>
        </Specimen>
      </GalleryGroup>

      <GalleryGroup title="Typography">
        <Specimen
          title="Type ramp"
          description={'<Text variant="…" tone="…">. Each variant bundles family, size, line height and tracking — never set fontSize by hand.'}
          guidelines={[
            'One title per screen. Hierarchy comes from weight and colour before size.',
            'Use tone="muted" for secondary text instead of a custom grey.',
            'Money always renders through MoneyText so sign, colour and currency stay consistent.',
          ]}
        >
          {(Object.keys(TEXT_VARIANTS) as TextVariant[]).map((v) => (
            <View key={v} style={{ gap: 2 }}>
              <Text variant={v} numberOfLines={1}>{v.startsWith('amount') ? '$1,234.56' : 'Track every rupee'}</Text>
              <Text variant="caption" tone="muted">
                {`${v} · ${TEXT_VARIANTS[v].fontSize}/${TEXT_VARIANTS[v].lineHeight} · ${TYPE_USAGE[v]}`}
              </Text>
            </View>
          ))}
        </Specimen>

        <Specimen title="Tones" description="Semantic text colours.">
          <SpecimenRow>
            {(['default', 'muted', 'primary', 'success', 'danger', 'warning', 'info'] as const).map((t) => (
              <Text key={t} variant="bodyStrong" tone={t}>{t}</Text>
            ))}
          </SpecimenRow>
        </Specimen>
      </GalleryGroup>

      <GalleryGroup title="Layout">
        <Specimen
          title="Spacing"
          description="4px grid. spacing('4') → 16. Screen padding is 16, section gap 20."
          guidelines={['Related items: 4–8. Items in a group: 12–16. Between sections: 20–24.']}
        >
          {(Object.keys(SPACING) as SpacingToken[]).filter((k) => SPACING[k] > 0 && SPACING[k] <= 64).map((k) => (
            <View key={k} style={styles.swatchRow}>
              <Text variant="caption" tone="muted" style={{ width: 36 }}>{k}</Text>
              <View style={{ width: SPACING[k] * 2.5, height: 10, borderRadius: 3, backgroundColor: colors.primary }} />
              <Text variant="caption" tone="muted">{SPACING[k]}px</Text>
            </View>
          ))}
        </Specimen>

        <Specimen title="Shape" description="Two families. Pill: controls only (buttons, icon buttons, chips, badges, segmented, search, tab bar). Soft: everything else (cards xl, hero/sheets/dialogs 2xl, tiles & inputs lg, icon tiles 30% squircle).">
          <SpecimenRow>
            <View style={{ alignItems: 'center', gap: spacing('1') }}>
              <View style={{ width: 96, height: 36, borderRadius: RADIUS.full, backgroundColor: colors.primary }} />
              <Text variant="caption" tone="muted">pill · control</Text>
            </View>
            <View style={{ alignItems: 'center', gap: spacing('1') }}>
              <View style={{ width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: alpha(colors.primary, 'soft') }} />
              <Text variant="caption" tone="muted">circle · icon btn</Text>
            </View>
          </SpecimenRow>
          <SpecimenRow>
            {(['md', 'lg', 'xl', '2xl'] as RadiusToken[]).map((k) => (
              <View key={k} style={{ alignItems: 'center', gap: spacing('1') }}>
                <View style={{ width: 52, height: 52, borderRadius: RADIUS[k], backgroundColor: alpha(colors.primary, 'soft') }} />
                <Text variant="caption" tone="muted">{`${k} ${RADIUS[k]}`}</Text>
              </View>
            ))}
          </SpecimenRow>
        </Specimen>

        <Specimen title="Density" description="One control-height scale: 36 sm · 44 md · 52 lg — buttons, icon buttons, segmented controls, chips (36) and search (44) line up in any row.">
          <SpecimenRow>
            {([36, 44, 52] as const).map((h) => (
              <View key={h} style={{ alignItems: 'center', gap: spacing('1') }}>
                <View style={{ width: 72, height: h, borderRadius: RADIUS.full, backgroundColor: alpha(colors.text, 'subtle') }} />
                <Text variant="caption" tone="muted">{h}</Text>
              </View>
            ))}
          </SpecimenRow>
        </Specimen>

        <Specimen title="Iconography" description="Hugeicons (stroke). Sizes from layout.icon*: 16 inline, 20 default, 24 navigation, 28 hero.">
          <SpecimenRow>
            {[layout.iconSm, layout.iconMd, layout.iconLg, layout.iconXl].map((s) => (
              <View key={s} style={{ alignItems: 'center', gap: spacing('1'), width: 56 }}>
                <Icon name="house" size={s} color={colors.text} />
                <Text variant="caption" tone="muted">{s}</Text>
              </View>
            ))}
          </SpecimenRow>
        </Specimen>

        <Specimen
          title="Icon registry"
          description={'Every icon by name: <Icon name="…" family="hugeicons" />. Swap a glyph app-wide by editing its entry in components/ui/icon-registry.ts. Stored names (category and account icons) live in user data: never rename them.'}
        >
          <View style={styles.iconGrid}>
            {ICON_NAMES.map((name) => (
              <View key={name} style={[styles.iconCell, { gap: spacing('1') }]}>
                <Icon name={name} size={layout.iconMd} color={colors.text} />
                <Text variant="micro" tone="muted" numberOfLines={1}>{name}</Text>
              </View>
            ))}
          </View>
        </Specimen>
      </GalleryGroup>
    </View>
  );
}

const styles = StyleSheet.create({
  swatchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  swatch: { width: 40, height: 40, borderWidth: StyleSheet.hairlineWidth },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  iconCell: { width: '25%', alignItems: 'center', paddingVertical: 8 },
});
