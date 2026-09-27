import { Header, HeaderProps } from './Header';
import { PageBackground } from './PageBackground';
import { useTheme } from '@/src/providers/ThemeProvider';
import React from 'react';
import { ScrollView, ScrollViewProps, StyleProp, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardInset } from '@/src/hooks/useKeyboardInset';

type ScreenProps = {
  children: React.ReactNode;
  /** Renders the standard Header. Omit for screens with a custom header. */
  header?: HeaderProps;
  /**
   * `scroll` — content in a ScrollView with screen padding (default).
   * `fixed` — plain View; bring your own FlatList / layout.
   */
  variant?: 'scroll' | 'fixed';
  /** Tab screens: pad the bottom so the last row clears the floating tab bar. */
  tabBar?: boolean;
  /** Remove horizontal screen padding (edge-to-edge carousels, full-bleed lists). */
  edgeToEdge?: boolean;
  /** Rendered outside the scroll area, pinned to the bottom (Save button). */
  footer?: React.ReactNode;
  /** Sheets, dialogs — rendered last so they layer above content. */
  overlays?: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, 'contentContainerStyle' | 'children'>;
  edges?: Edge[];
  /** Forms: lift the body and footer above the keyboard (Android edge-to-edge safe). */
  keyboardAvoiding?: boolean;
  /** Reserve room so the last row clears a floating <Fab>. */
  hasFab?: boolean;
};

/**
 * Standard screen scaffold: safe area + background + header + padded scroll body.
 * Every full screen should start here so spacing and insets stay identical app-wide.
 */
export function Screen({
  children,
  header,
  variant = 'scroll',
  tabBar = false,
  edgeToEdge = false,
  footer,
  overlays,
  contentContainerStyle,
  scrollProps,
  edges = ['top'],
  keyboardAvoiding = false,
  hasFab = false,
}: ScreenProps) {
  const { layout, spacing, tabBarClearance } = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardInset(keyboardAvoiding, footer ? insets.bottom : 0);

  const bottomPad = tabBar
    ? tabBarClearance(insets.bottom)
    : footer
      ? spacing('4')
      : insets.bottom + spacing('6');

  const bodyStyle: ViewStyle = {
    paddingHorizontal: edgeToEdge ? 0 : layout.screenPadding,
    paddingBottom: bottomPad + (hasFab ? 56 + spacing('6') : 0),
    gap: layout.sectionGap,
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={edges}>
      <PageBackground />
      {header ? <Header {...header} /> : null}

      <View style={{ flex: 1, paddingBottom: keyboardInset }}>
        {variant === 'scroll' ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            {...scrollProps}
            contentContainerStyle={[bodyStyle, contentContainerStyle]}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, contentContainerStyle]}>{children}</View>
        )}

        {footer ? (
          <View style={{ paddingHorizontal: layout.screenPadding, paddingTop: spacing('3'), paddingBottom: insets.bottom + spacing('3') }}>
            {footer}
          </View>
        ) : null}
      </View>

      {overlays}
    </SafeAreaView>
  );
}
