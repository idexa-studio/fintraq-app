const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql');

// Release builds are tree-shaken (the two EXPO_UNSTABLE_* variables in eas.json): code the app
// never reaches is left out of the bundle, about 9% of it when this was switched on. With that
// on, Metro hands each file's syntax tree between processes, and the trees this project produces
// cannot be copied across ("Symbol() could not be cloned"), so the bundler runs in one process.
if (process.env.EXPO_UNSTABLE_TREE_SHAKING === '1') config.maxWorkers = 1;

module.exports = config;
