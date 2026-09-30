import type { IconSource } from '@/src/components/ui';
import { HandSwipeLeftIcon, HandTapIcon } from '@/src/components/ui/icons';
import { StorageKeys } from '@/src/constants/keys';

/**
 * Tips exist only for interactions a user cannot discover by looking at the screen — hidden
 * gestures. Anything visible (buttons, filters, menus, the + in the tab bar) teaches itself and
 * gets no tip. Before adding one, ask: is there any visual affordance for this? If yes, no tip.
 *
 * Storage keys are the ones earlier releases used, so a tip dismissed before stays dismissed.
 */
export const FEATURE_TIPS = {
  swipeActions: { icon: HandSwipeLeftIcon, storageKey: StorageKeys.WALKTHROUGH_TRANSACTIONS },
  categoryOptions: { icon: HandTapIcon, storageKey: StorageKeys.WALKTHROUGH_CATEGORIES },
} as const satisfies Record<string, { icon: IconSource; storageKey: StorageKeys }>;

export type FeatureTipId = keyof typeof FEATURE_TIPS;
