import { SIZE } from '@/design/tokens/metrics';
import { LAYOUT, widthClassOf } from '@/design/tokens/layout';
import type { WidthClass } from '@/design/tokens/layout';
import React, { createContext, useContext, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type Layout = {
  /** The room the app has, side to side, clear of a notch or a rounded corner. */
  width: number;
  height: number;
  widthClass: WidthClass;
  /** A phone's layout: one column, edge to edge. */
  isCompact: boolean;
  /** The tabs are a rail at the side, and a screen may lay its cards in two columns. */
  isExpanded: boolean;
  /** The widest a screen's column is drawn, page margins included. */
  column: number;
  /** The same for a screen that lays its cards in two columns. */
  wide: number;
};

function layoutFor(width: number, height: number): Layout {
  const widthClass = widthClassOf(width);
  return {
    width,
    height,
    widthClass,
    isCompact: widthClass === 'compact',
    isExpanded: widthClass === 'expanded',
    column: LAYOUT.column + SIZE.screenPadding * 2,
    wide: LAYOUT.wide + SIZE.screenPadding * 2,
  };
}

const LayoutContext = createContext<Layout | null>(null);

/**
 * The shape of the space the app is drawn in. It follows the window as it is turned, folded or
 * split, so a component that reads it is laid out again without being told. Nothing outside
 * `design/` measures the window itself.
 */
export function useLayout(): Layout {
  const pinned = useContext(LayoutContext);
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const width = window.width - insets.left - insets.right;
  const live = useMemo(() => layoutFor(width, window.height), [width, window.height]);
  return pinned ?? live;
}

/** Inside a screen that lays its cards in two columns, the page is the wider one: its header and footer follow. */
export function WidePage({ children }: { children: React.ReactNode }) {
  const layout = useLayout();
  const wide = useMemo(() => ({ ...layout, column: layout.wide }), [layout]);
  return <LayoutContext.Provider value={wide}>{children}</LayoutContext.Provider>;
}

export type LayoutProviderProps = {
  width: number;
  height: number;
  children: React.ReactNode;
};

/** Draws what it holds as if the window were this size: for the gallery's previews of other screens. */
export function LayoutProvider({ width, height, children }: LayoutProviderProps) {
  const layout = useMemo(() => layoutFor(width, height), [width, height]);
  return <LayoutContext.Provider value={layout}>{children}</LayoutContext.Provider>;
}
