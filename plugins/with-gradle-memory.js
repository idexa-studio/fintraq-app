const { withGradleProperties } = require('@expo/config-plugins');

// Release builds run R8/Kotlin classpath-snapshot transforms that need more
// than Gradle's stock default (-Xmx512m -XX:MaxMetaspaceSize=256m, bumped by
// the RN template to -Xmx2048m/512m). A prior attempt at raising this used
// `extraGradleProps` on the `expo-build-properties` plugin, which is not a
// real config key that plugin supports (only `extraMavenRepos` is) — it
// silently no-op'd, so gradle.properties kept shipping the too-small
// default and release builds died with "Metaspace" OOM during
// :app:compileReleaseKotlin. `withGradleProperties` is the actual supported
// Expo API for writing gradle.properties keys.
const GRADLE_JVM_ARGS = '-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError';
const KOTLIN_DAEMON_JVM_ARGS = '-Xmx2048m -XX:MaxMetaspaceSize=1024m';

module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (config) => {
    const setProp = (key, value) => {
      const existing = config.modResults.find((item) => item.type === 'property' && item.key === key);
      if (existing) {
        existing.value = value;
      } else {
        config.modResults.push({ type: 'property', key, value });
      }
    };

    setProp('org.gradle.jvmargs', GRADLE_JVM_ARGS);
    setProp('kotlin.daemon.jvmargs', KOTLIN_DAEMON_JVM_ARGS);

    return config;
  });
};
