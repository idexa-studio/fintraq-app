const { AndroidConfig, withAndroidManifest, withMainActivity } = require('@expo/config-plugins');

/** A screen this wide (in dp, on its shorter side) is a tablet or an unfolded phone. */
const TURNS_FROM_DP = 600;

/**
 * A change the app answers itself instead of being restarted: the window's shorter side, which is
 * what folding, unfolding and split screen change. React Native lays the screen out again.
 *
 * `density` and `fontScale` are deliberately not here. Both were tried on a phone (2026-10-13):
 * React Native keeps text it has already measured, so after a density change labels were drawn
 * clipped ("Expe", "Save"), and a new font size was not picked up at all. For those two Android
 * restarts the activity, which is clean.
 */
const HANDLED = ['smallestScreenSize'];

const MARK = '// @fintraq any-screen-size';

const IMPORTS = ['android.content.pm.ActivityInfo', 'android.content.res.Configuration', 'com.facebook.react.uimanager.DisplayMetricsHolder'];

const METHODS = `
  ${MARK}
  /** A phone stays upright. A tablet, or a phone unfolded, turns as it is held. */
  private fun holdPhonesUpright(configuration: Configuration) {
    requestedOrientation =
        if (configuration.smallestScreenWidthDp < ${TURNS_FROM_DP}) ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        else ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
  }

  /**
   * React Native reads the screen's density from the application, which is always the phone's own
   * screen. On another screen (Samsung DeX, a monitor) the activity runs at that screen's density,
   * so text measured and drawn at the phone's came out more than twice the size of its box, cut
   * off. React Native is given the density of the screen this activity is on instead. It reads the
   * application's again when its view is made and on every configuration change, so this follows both.
   */
  private fun measureOnThisScreen() {
    DisplayMetricsHolder.initDisplayMetrics(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    measureOnThisScreen()
    holdPhonesUpright(newConfig)
  }
`;

function replaceOnce(source, anchor, replacement) {
  if (!source.includes(anchor)) throw new Error(`with-any-screen-size: "${anchor}" is not in MainActivity; the template has changed`);
  return source.replace(anchor, replacement);
}

/**
 * Lets the app be used at any size. `app.json` locks the whole app upright, which on Android is
 * one line in the manifest for every device: before Android 16 a tablet could not be turned at all.
 *
 * So the manifest lock is removed and the activity decides for itself: upright under 600dp, free
 * above. It also measures text at the density of the screen it is on, which on a second screen
 * (Samsung DeX) is not the phone's. iOS needs none of this: Expo already lets an iPad turn and
 * keeps an iPhone upright.
 */
module.exports = function withAnyScreenSize(config) {
  config = withAndroidManifest(config, (config) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
    delete activity.$['android:screenOrientation'];
    const changes = new Set((activity.$['android:configChanges'] ?? '').split('|').filter(Boolean));
    HANDLED.forEach((change) => changes.add(change));
    activity.$['android:configChanges'] = [...changes].join('|');
    return config;
  });

  return withMainActivity(config, (config) => {
    let source = config.modResults.contents;
    if (source.includes(MARK)) return config;
    if (config.modResults.language !== 'kt') throw new Error('with-any-screen-size: MainActivity is expected in Kotlin');

    source = replaceOnce(source, 'import android.os.Bundle', `import android.os.Bundle\n${IMPORTS.map((name) => `import ${name}`).join('\n')}`);
    source = replaceOnce(source, 'super.onCreate(null)', 'holdPhonesUpright(resources.configuration)\n    measureOnThisScreen()\n    super.onCreate(null)\n    measureOnThisScreen()');
    source = replaceOnce(source, `  /**\n   * Returns the name of the main component`, `${METHODS.trimStart().replace(/^/, '  ')}\n  /**\n   * Returns the name of the main component`);

    config.modResults.contents = source;
    return config;
  });
};
