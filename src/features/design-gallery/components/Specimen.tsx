import { Text } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type SpecimenProps = {
  /** Component name as imported, e.g. "Button". */
  title: string;
  description?: string;
  /** Short usage rules shown as a checklist under the preview. */
  guidelines?: string[];
  /** Render the preview directly on the page background instead of a surface panel. */
  bare?: boolean;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

/** One documented component: name, purpose, live preview, usage rules. */
export function Specimen({ title, description, guidelines, bare = false, children, contentStyle }: SpecimenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text variant="headline">{title}</Text>
        {description ? <Text variant="callout" tone="muted">{description}</Text> : null}
      </View>

      <View style={[bare ? styles.bare : styles.panel, contentStyle]}>{children}</View>

      {guidelines?.length ? (
        <View style={styles.guidelines}>
          {guidelines.map((g) => (
            <View key={g} style={styles.guideline}>
              <View style={styles.bullet} />
              <Text variant="caption" tone="muted" style={styles.guidelineText}>{g}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Labelled row of variants inside a Specimen. */
export function SpecimenRow({ label, children, wrap = true }: { label?: string; children: React.ReactNode; wrap?: boolean }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing('2') }}>
      {label ? <Text variant="label" tone="muted">{label}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: wrap ? 'wrap' : 'nowrap', alignItems: 'center', gap: spacing('2') }}>
        {children}
      </View>
    </View>
  );
}

/** Section heading that groups several specimens. */
export function GalleryGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const { spacing, colors, alpha, radius } = useTheme();
  return (
    <View style={{ gap: spacing('6') }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing('2') }}>
        <View style={{ width: 4, height: 16, borderRadius: radius('full'), backgroundColor: colors.primary }} />
        <Text variant="label" tone="primary">{title.toUpperCase()}</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: alpha(colors.primary, 'subtle') }} />
      </View>
      {children}
    </View>
  );
}

const createStyles = ({ colors, spacing }: ThemeContextType) =>
  StyleSheet.create({
    wrap: { gap: spacing('3') },
    header: { gap: spacing('1') },
    // screens use — so what you see here is exactly what ships.
    panel: { gap: spacing('4'), paddingVertical: spacing('1') },
    bare: { gap: spacing('3') },
    guidelines: { gap: spacing('1.5'), paddingHorizontal: spacing('1') },
    guideline: { flexDirection: 'row', gap: spacing('2'), alignItems: 'flex-start' },
    bullet: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 6 },
    guidelineText: { flex: 1 },
  });
