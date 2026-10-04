import { ActionsSection } from '@/src/features/design-gallery/sections/ActionsSection';
import { DisplaySection } from '@/src/features/design-gallery/sections/DisplaySection';
import { FeedbackSection } from '@/src/features/design-gallery/sections/FeedbackSection';
import { FoundationsSection } from '@/src/features/design-gallery/sections/FoundationsSection';
import { InputsSection } from '@/src/features/design-gallery/sections/InputsSection';
import { OverlaysSection } from '@/src/features/design-gallery/sections/OverlaysSection';
import { PatternsSection } from '@/src/features/design-gallery/sections/PatternsSection';
import { ShowcaseSection } from '@/src/features/design-gallery/sections/ShowcaseSection';
import { Chip, Header, IconButton, PageBackground, Text } from '@/src/components/ui';
import { ThemeProvider, useTheme } from '@/src/providers/ThemeProvider';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const SECTIONS = [
  { key: 'showcase', label: 'Showcase', Component: ShowcaseSection },
  { key: 'foundations', label: 'Foundations', Component: FoundationsSection },
  { key: 'actions', label: 'Actions', Component: ActionsSection },
  { key: 'inputs', label: 'Inputs', Component: InputsSection },
  { key: 'display', label: 'Display', Component: DisplaySection },
  { key: 'feedback', label: 'Feedback', Component: FeedbackSection },
  { key: 'overlays', label: 'Overlays', Component: OverlaysSection },
  { key: 'patterns', label: 'Patterns', Component: PatternsSection },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

/**
 * Living catalogue of the design system. Every primitive in src/components/ui
 * appears here with its variants, states and usage rules. Preview either theme
 * without touching the user's saved setting.
 */
export function DesignGalleryScreen() {
  const { isDark } = useTheme();
  const [scheme, setScheme] = useState<'light' | 'dark'>(isDark ? 'dark' : 'light');

  return (
    <ThemeProvider scheme={scheme}>
      <GalleryContent scheme={scheme} onToggleScheme={() => setScheme((s) => (s === 'dark' ? 'light' : 'dark'))} />
    </ThemeProvider>
  );
}

function GalleryContent({ scheme, onToggleScheme }: { scheme: 'light' | 'dark'; onToggleScheme: () => void }) {
  const { spacing, layout, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [active, setActive] = useState<SectionKey>('showcase');
  const { Component, label } = SECTIONS.find((s) => s.key === active) ?? SECTIONS[0];

  const select = useCallback((key: SectionKey) => {
    setActive(key);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <PageBackground />
      <Header
        title="Design gallery"
        showBack
        rightAction={
          <IconButton
            icon={scheme === 'dark' ? 'theme-light' : 'theme-dark'}
            onPress={onToggleScheme}
            accessibilityLabel={`Preview ${scheme === 'dark' ? 'light' : 'dark'} theme`}
          />
        }
      />

      <View style={{ backgroundColor: colors.background, paddingBottom: spacing('3') }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: layout.screenPadding, gap: spacing('2') }}
        >
          {SECTIONS.map((s) => (
            <Chip key={s.key} label={s.label} isActive={s.key === active} onPress={() => select(s.key)} />
          ))}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: layout.screenPadding,
          paddingTop: spacing('3'),
          paddingBottom: insets.bottom + spacing('10'),
          gap: spacing('6'),
        }}
      >
        <Text variant="caption" tone="muted">
          {`${label} · ${scheme} theme · src/components/ui`}
        </Text>
        <Component />
      </ScrollView>
    </SafeAreaView>
  );
}
