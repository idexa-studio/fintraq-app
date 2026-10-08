import { ActionsSection } from '@/features/gallery/sections/ActionsSection';
import { BrandSection } from '@/features/gallery/sections/BrandSection';
import { EntrySection } from '@/features/gallery/sections/EntrySection';
import { DisplaySection } from '@/features/gallery/sections/DisplaySection';
import { FeedbackSection } from '@/features/gallery/sections/FeedbackSection';
import { FoundationsSection } from '@/features/gallery/sections/FoundationsSection';
import { HomeSection } from '@/features/gallery/sections/HomeSection';
import { IdeasSection } from '@/features/gallery/sections/IdeasSection';
import { InsightsSection } from '@/features/gallery/sections/InsightsSection';
import { InputsSection } from '@/features/gallery/sections/InputsSection';
import { MatchSection } from '@/features/gallery/sections/MatchSection';
import { MoneySection } from '@/features/gallery/sections/MoneySection';
import { NavigationSection } from '@/features/gallery/sections/NavigationSection';
import { PickersSection } from '@/features/gallery/sections/PickersSection';
import { ScriptsSection } from '@/features/gallery/sections/ScriptsSection';
import { StressSection } from '@/features/gallery/sections/StressSection';
import { SystemSection } from '@/features/gallery/sections/SystemSection';
import { Chip, ChipRow, Header, IconButton, Screen, ThemeProvider, ToastProvider, useTheme } from '@/design';
import type { Scheme } from '@/design';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { View } from 'react-native';

const SECTIONS = [
  // The app's own widgets first, then the parts they are built from.
  { key: 'home', label: 'Home', Component: HomeSection },
  { key: 'entry', label: 'Add', Component: EntrySection },
  { key: 'money', label: 'Money', Component: MoneySection },
  { key: 'insights', label: 'Insights', Component: InsightsSection },
  { key: 'system', label: 'Pro & system', Component: SystemSection },
  { key: 'pickers', label: 'Pickers', Component: PickersSection },
  { key: 'ideas', label: 'Moments', Component: IdeasSection },
  { key: 'foundations', label: 'Foundations', Component: FoundationsSection },
  { key: 'actions', label: 'Actions', Component: ActionsSection },
  { key: 'inputs', label: 'Inputs', Component: InputsSection },
  { key: 'display', label: 'Display', Component: DisplaySection },
  { key: 'feedback', label: 'Feedback', Component: FeedbackSection },
  { key: 'navigation', label: 'Navigation', Component: NavigationSection },
] as const;

/** Reachable by link only: tools for tuning the system, not specimens. */
const HIDDEN = [
  { key: 'brand', label: 'Brand', Component: BrandSection },
  { key: 'match', label: 'Match', Component: MatchSection },
  { key: 'scripts', label: 'Scripts', Component: ScriptsSection },
  { key: 'stress', label: 'Stress', Component: StressSection },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'] | (typeof HIDDEN)[number]['key'];

const isSectionKey = (value: unknown): value is SectionKey => [...SECTIONS, ...HIDDEN].some((s) => s.key === value);

/**
 * The living catalogue of the design system: every token and component, in
 * both schemes. `?section=` and `?scheme=` open it at a given place, which is
 * how it is captured for review.
 */
export function GalleryScreen() {
  const params = useLocalSearchParams<{ section?: string; scheme?: string; at?: string }>();
  const [scheme, setScheme] = useState<Scheme>(params.scheme === 'dark' ? 'dark' : 'light');
  const [active, setActive] = useState<SectionKey>(isSectionKey(params.section) ? params.section : 'home');

  // A link that arrives while the gallery is already open moves it to that section.
  // `at` is any changing value, so the same link can be sent twice.
  const link = `${params.section}|${params.scheme}|${params.at}`;
  const [followed, setFollowed] = useState(link);
  if (followed !== link) {
    setFollowed(link);
    if (isSectionKey(params.section)) setActive(params.section);
    if (params.scheme === 'dark' || params.scheme === 'light') setScheme(params.scheme);
  }

  return (
    <ThemeProvider scheme={scheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <ToastProvider>
        <Gallery scheme={scheme} onToggleScheme={() => setScheme(scheme === 'dark' ? 'light' : 'dark')} active={active} onSelect={setActive} />
      </ToastProvider>
    </ThemeProvider>
  );
}

type GalleryProps = {
  scheme: Scheme;
  onToggleScheme: () => void;
  active: SectionKey;
  onSelect: (key: SectionKey) => void;
};

function Gallery({ scheme, onToggleScheme, active, onSelect }: GalleryProps) {
  const { space } = useTheme();
  const router = useRouter();
  const { Component } = [...SECTIONS, ...HIDDEN].find((s) => s.key === active) ?? SECTIONS[0];
  const other = scheme === 'dark' ? 'light' : 'dark';

  return (
    // Remounting on change resets the scroll position and the section's local state.
    <Screen
      key={active}
      header={
        <View>
          <Header
            task
            title="Design gallery"
            onBack={router.canGoBack() ? () => router.back() : undefined}
            right={<IconButton icon={scheme === 'dark' ? 'theme-light' : 'theme-dark'} onPress={onToggleScheme} accessibilityLabel={`Preview the ${other} scheme`} />}
          />
          <View style={{ paddingVertical: space.md }}>
            <ChipRow>
              {SECTIONS.map((s) => <Chip key={s.key} label={s.label} selected={s.key === active} onPress={() => onSelect(s.key)} />)}
            </ChipRow>
          </View>
        </View>
      }
    >
      <Component />
    </Screen>
  );
}
