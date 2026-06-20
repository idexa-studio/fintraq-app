import { MaterialCommunityIcons } from '@expo/vector-icons';

export type MaterialIconName = keyof typeof MaterialCommunityIcons.glyphMap;
export type IoniconName = MaterialIconName; // Temporary alias to prevent compile errors during migration

export const LEGACY_ICON_MAP: Record<string, MaterialIconName> = {
  "wallet-outline": "domain",
  "card-outline": "card-outline",
  "cash-outline": "cash",
  "receipt-outline": "receipt-text-outline",
  "document-text-outline": "file-document-outline",
  "shield-checkmark-outline": "shield-check-outline",
  "key-outline": "key-outline",
  "lock-closed-outline": "lock-outline",
  "id-card-outline": "card-account-details-outline",
  "diamond-outline": "diamond-stone",
  "trending-up-outline": "trending-up",
  "stats-chart-outline": "chart-bar",
  "pie-chart-outline": "chart-pie",
  "analytics-outline": "chart-timeline-variant",
  "layers-outline": "layers-outline",
  "bar-chart-outline": "chart-bar",
  "rocket-outline": "rocket-launch-outline",
  "pulse-outline": "heart-pulse",
  "briefcase-outline": "briefcase-outline",
  "business-outline": "domain",
  "server-outline": "server",
  "laptop-outline": "laptop",
  "archive-outline": "archive-outline",
  "calculator-outline": "calculator",
  "desktop-outline": "monitor",
  "print-outline": "printer-outline",
  "home-outline": "home-outline",
  "car-outline": "car-outline",
  "airplane-outline": "airplane",
  "heart-outline": "heart-outline",
  "school-outline": "school-outline",
  "trophy-outline": "trophy-outline",
  "flag-outline": "flag-outline",
  "compass-outline": "compass-outline",
  "phone-portrait-outline": "cellphone",
  "globe-outline": "earth",
  "people-outline": "account-group-outline",
  "leaf-outline": "leaf",
  "gift-outline": "gift-outline",
  "star-outline": "star-outline",
  "moon-outline": "moon-waning-crescent",
  "sunny-outline": "weather-sunny",
  "cog-outline": "cog-outline",
  "hammer-outline": "hammer",
  "flash-outline": "flash-outline",
  "water-outline": "water-outline",
  "refresh-outline": "refresh",
  "fast-food-outline": "hamburger",
  "restaurant-outline": "silverware-fork-knife",
  "cafe-outline": "coffee-outline",
  "pizza-outline": "pizza",
  "wine-outline": "glass-wine",
  "beer-outline": "beer-outline",
  "ice-cream-outline": "ice-cream",
  "basket-outline": "basket-outline",
  "nutrition-outline": "food-apple",
  "egg-outline": "egg-outline",
  "bus-outline": "bus",
  "train-outline": "train",
  "bicycle-outline": "bike",
  "boat-outline": "sail-boat",
  "speedometer-outline": "speedometer",
  "locate-outline": "crosshairs-gps",
  "walk-outline": "walk",
  "subway-outline": "subway",
  "wifi-outline": "wifi",
  "build-outline": "wrench-outline",
  "bed-outline": "bed-outline",
  "thermometer-outline": "thermometer",
  "flame-outline": "fire",
  "medkit-outline": "medical-bag",
  "bandage-outline": "bandage",
  "barbell-outline": "weight-lifter",
  "fitness-outline": "heart-pulse",
  "accessibility-outline": "human",
  "body-outline": "human",
  "hardware-chip-outline": "cpu-64-bit",
  "tablet-portrait-outline": "tablet",
  "headset-outline": "headset",
  "cloud-outline": "cloud-outline",
  "bag-outline": "shopping-outline",
  "cart-outline": "cart-outline",
  "repeat-outline": "repeat",
  "cut-outline": "content-cut",
  "umbrella-outline": "umbrella-outline",
  "shirt-outline": "tshirt-crew-outline",
  "film-outline": "filmstrip",
  "game-controller-outline": "gamepad-variant-outline",
  "musical-notes-outline": "music-note",
  "camera-outline": "camera-outline",
  "color-palette-outline": "palette-outline",
  "book-outline": "book-open-page-variant-outline",
  "football-outline": "football",
  "golf-outline": "golf",
  "library-outline": "library",
  "pencil-outline": "pencil-outline",
  "person-outline": "account-outline",
  "happy-outline": "emoticon-happy-outline",
  "paw-outline": "paw",
  "heart-circle-outline": "heart-circle-outline",
  "ribbon-outline": "ribbon",
  "chatbubbles-outline": "chat-outline",
  "sparkles-outline": "creation",
  "bulb-outline": "lightbulb-on-outline",
  "grid-outline": "grid",
  "ellipsis-horizontal-outline": "dots-horizontal",
  "time-outline": "clock-outline",
  "alarm-outline": "alarm",
  "calendar-outline": "calendar-outline",
  "map-outline": "map-outline"
};

/**
 * Safely resolve a string (e.g. from the database) to a valid MaterialIconName.
 * Returns the fallback when the stored value is not a recognised icon key.
 */
export function resolveIcon(
  icon: string | null | undefined,
  fallback: MaterialIconName,
): MaterialIconName {
  if (!icon) return fallback;

  let resolved = icon;
  
  if (resolved in LEGACY_ICON_MAP) {
    resolved = LEGACY_ICON_MAP[resolved];
  }

  if (!resolved.endsWith('-outline') && `${resolved}-outline` in MaterialCommunityIcons.glyphMap) {
    resolved = `${resolved}-outline`;
  }

  if (resolved in MaterialCommunityIcons.glyphMap) {
    return resolved as MaterialIconName;
  }
  return fallback;
}
