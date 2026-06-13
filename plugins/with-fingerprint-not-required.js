const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withFingerprintNotRequired(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // Ensure the <uses-feature> tag exists
    if (!Array.isArray(androidManifest['uses-feature'])) {
      androidManifest['uses-feature'] = [];
    }

    // Add android.hardware.fingerprint with android:required="false"
    androidManifest['uses-feature'].push({
      $: {
        'android:name': 'android.hardware.fingerprint',
        'android:required': 'false',
      },
    });

    // Add android.hardware.biometrics with android:required="false"
    androidManifest['uses-feature'].push({
      $: {
        'android:name': 'android.hardware.biometrics',
        'android:required': 'false',
      },
    });

    return config;
  });
};
