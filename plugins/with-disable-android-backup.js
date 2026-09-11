const { withAndroidManifest } = require('@expo/config-plugins');

// Android's Auto Backup for Apps silently restores SharedPreferences (including
// expo-task-manager's persisted background-task registry) from Google's cloud
// backup on a fresh install of the same package — "uninstall + reinstall" is not
// actually a clean slate unless this is off. Confirmed: a stale WorkManager
// interval survived a full uninstall/reinstall on a real device because of this.
// Also desirable on its own for a finance app — local data shouldn't be cloud-backed.
module.exports = function withDisableAndroidBackup(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (application?.$) {
      application.$['android:allowBackup'] = 'false';
    }
    return config;
  });
};
