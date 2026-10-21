const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// R8's resource shrinking (on since 2.1.0) removes any resource no code or layout points at.
// These are looked up by name at run time, from names that live only in the JavaScript bundle,
// so the shrinker cannot see they are used: the reminder's chime (a notification channel's sound),
// the notification icon notify-kit asks for by name, and the launcher shortcuts' icons. Without
// this the store build would post silent reminders and blank shortcuts. Not named keep.xml: React
// Native's bundling writes its own res/raw/keep.xml for the JavaScript's images and fonts, and the
// two would be one resource, with ours lost (found on the first R8 build of 2.1.0).
const KEEP = ['@raw/fintraq_reminder', '@drawable/notification_icon', '@mipmap/shortcut_*'];

module.exports = function withKeptResources(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const dir = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'raw');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, 'fintraq_keep.xml'),
        `<?xml version="1.0" encoding="utf-8"?>\n<resources xmlns:tools="http://schemas.android.com/tools" tools:keep="${KEEP.join(',')}" />\n`,
      );
      return config;
    },
  ]);
};
