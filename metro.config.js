const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql');

// Expo's tree shaking (EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH and EXPO_UNSTABLE_TREE_SHAKING) is off, and
// must stay off until it is proven on an installed release build. It made the bundle 9% smaller,
// and a fresh install of that build never got past its first screen: the redirect to first run
// went round in a loop (found 2026-10-08 on the first store build; docs/ARCHITECTURE.md).

module.exports = config;
