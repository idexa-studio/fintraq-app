import { GalleryGroup, Specimen, SpecimenRow } from '@/src/features/design-gallery/components/Specimen';
import { BentoPressable, Button, ButtonVariant, IconButton, IconButtonVariant, Text } from '@/src/components/ui';
import { useTheme } from '@/src/providers/ThemeProvider';
import { ArrowRightIcon, DotsThreeVerticalIcon, MagnifyingGlassIcon, PlusIcon, SlidersHorizontalIcon, TrashIcon } from '@/src/components/ui/icons';
import React, { useState } from 'react';
import { View } from 'react-native';

const noop = () => {};
const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'tonal', 'secondary', 'outline', 'ghost', 'danger', 'success'];
const ICON_BUTTON_VARIANTS: IconButtonVariant[] = ['surface', 'ghost', 'tonal', 'filled', 'danger'];

export function ActionsSection() {
  const { spacing, colors, radius } = useTheme();
  const [loading, setLoading] = useState(false);

  const simulateSave = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <View style={{ gap: spacing('9') }}>
      <GalleryGroup title="Buttons">
        <Specimen
          title="Button"
          description="Text actions. One primary button per screen; everything else steps down in emphasis."
          guidelines={[
            'primary — the single main action (Save, Add transaction).',
            'tonal — important but secondary (Add account from an empty state).',
            'secondary / outline — neutral alternatives (Cancel, Export).',
            'ghost — lowest emphasis, inline text actions.',
            'danger — irreversible actions, always behind a ConfirmDialog.',
            'Labels are verbs in sentence case: "Save changes", not "OK".',
          ]}
        >
          <SpecimenRow label="Variants">
            {BUTTON_VARIANTS.map((v) => (
              <Button key={v} title={v[0].toUpperCase() + v.slice(1)} variant={v} onPress={noop} />
            ))}
          </SpecimenRow>
          <SpecimenRow label="Sizes · sm 36 · md 44 · lg 52">
            <Button title="Small" size="sm" onPress={noop} />
            <Button title="Medium" size="md" onPress={noop} />
            <Button title="Large" size="lg" onPress={noop} />
          </SpecimenRow>
          <SpecimenRow label="With icon">
            <Button title="Add" icon={PlusIcon} onPress={noop} />
            <Button title="Continue" icon={ArrowRightIcon} iconPosition="trailing" variant="tonal" onPress={noop} />
            <Button title="Delete" icon={TrashIcon} variant="danger" onPress={noop} />
          </SpecimenRow>
          <SpecimenRow label="States">
            <Button title="Disabled" disabled onPress={noop} />
            <Button title={loading ? 'Saving' : 'Tap to load'} isLoading={loading} onPress={simulateSave} />
          </SpecimenRow>
          <SpecimenRow label="Full width — forms & sheets">
            <View style={{ flex: 1, gap: spacing('2') }}>
              <Button title="Save transaction" size="lg" fullWidth onPress={noop} />
              <Button title="Cancel" size="lg" variant="ghost" fullWidth onPress={noop} />
            </View>
          </SpecimenRow>
        </Specimen>

        <Specimen
          title="IconButton"
          description="Icon-only actions in headers, toolbars and cards. accessibilityLabel is required."
          guidelines={['Only for universally understood icons (search, filter, more, close).', 'Small sizes keep a 44pt hit area via hitSlop.']}
        >
          <SpecimenRow label="Variants">
            {ICON_BUTTON_VARIANTS.map((v) => (
              <IconButton key={v} icon={v === 'danger' ? TrashIcon : MagnifyingGlassIcon} variant={v} onPress={noop} accessibilityLabel={v} />
            ))}
          </SpecimenRow>
          <SpecimenRow label="Sizes · 32 · 40 · 48">
            <IconButton icon={SlidersHorizontalIcon} size="sm" onPress={noop} accessibilityLabel="Filter" />
            <IconButton icon={SlidersHorizontalIcon} size="md" onPress={noop} accessibilityLabel="Filter" />
            <IconButton icon={SlidersHorizontalIcon} size="lg" onPress={noop} accessibilityLabel="Filter" />
            <IconButton icon={DotsThreeVerticalIcon} variant="ghost" onPress={noop} accessibilityLabel="More" />
            <IconButton icon={PlusIcon} variant="filled" size="lg" onPress={noop} accessibilityLabel="Add" />
          </SpecimenRow>
          <SpecimenRow label="States">
            <IconButton icon={MagnifyingGlassIcon} disabled onPress={noop} accessibilityLabel="Disabled" />
            <IconButton icon={MagnifyingGlassIcon} isLoading onPress={noop} accessibilityLabel="Loading" />
          </SpecimenRow>
        </Specimen>

        <Specimen
          title="BentoPressable"
          description="The press primitive under every tappable element: native ripple on Android, scale + overlay on iOS. Use it for custom tappables instead of TouchableOpacity."
        >
          <BentoPressable onPress={noop} style={{ padding: spacing('4'), borderRadius: radius('lg'), backgroundColor: colors.card }}>
            <Text variant="bodyStrong">Press me</Text>
            <Text variant="caption" tone="muted">Custom content with platform press feedback</Text>
          </BentoPressable>
        </Specimen>
      </GalleryGroup>
    </View>
  );
}
