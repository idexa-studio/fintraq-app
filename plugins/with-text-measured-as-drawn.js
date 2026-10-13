const { withAndroidStyles } = require('@expo/config-plugins');

const TEXT_STYLE = 'FintraqTextView';

/**
 * From Android 15, an app that targets it has its text laid out by the ink of the letters
 * (`useBoundsForWidth`), so nothing is clipped at the edges. React Native still measures a text
 * by the advance of its letters. In scripts whose marks overhang, Devanagari above all, the two
 * disagree by a few pixels: a short label is measured to fit on one line and then drawn on two,
 * and its last word disappears ("सभी खाते" showed as "सभी"). Latin text never showed it.
 *
 * This turns the new behaviour off for every text view, so text is drawn the way it was measured.
 * Remove it once React Native measures with the same setting.
 */
module.exports = function withTextMeasuredAsDrawn(config) {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults.resources.style ?? (config.modResults.resources.style = []);

    if (!styles.some((style) => style.$.name === TEXT_STYLE)) {
      styles.push({
        $: { name: TEXT_STYLE, parent: 'Widget.AppCompat.TextView' },
        item: [
          { $: { name: 'android:useBoundsForWidth', 'tools:targetApi': '35' }, _: 'false' },
          { $: { name: 'android:shiftDrawingOffsetForStartOverhang', 'tools:targetApi': '35' }, _: 'false' },
        ],
      });
    }

    const appTheme = styles.find((style) => style.$.name === 'AppTheme');
    if (appTheme) {
      appTheme.item = (appTheme.item ?? []).filter((item) => item.$.name !== 'android:textViewStyle');
      appTheme.item.push({ $: { name: 'android:textViewStyle' }, _: `@style/${TEXT_STYLE}` });
    }
    return config;
  });
};
