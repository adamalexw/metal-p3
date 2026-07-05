const { withDangerousMod } = require('expo/config-plugins');
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const MARKER = '# metal-p3 keep rules';
const RULES = `
${MARKER}
# Expo modules resolve views/modules reflectively; R8 must not strip them.
-keep class expo.modules.** { *; }
-keepclassmembers class expo.modules.** { *; }
-keep class kotlin.reflect.** { *; }
-keepclassmembers class * {
  @expo.modules.core.interfaces.DoNotStrip *;
}
-keep class com.facebook.react.bridge.JSIModulePackage { *; }
-keep class com.facebook.react.bridge.JSIModuleProvider { *; }
-keep class com.facebook.react.bridge.UIManager { *; }
`;

module.exports = function withProguardRules(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const proguardPath = join(config.modRequest.platformProjectRoot, 'app', 'proguard-rules.pro');
      const contents = readFileSync(proguardPath, 'utf8');
      if (!contents.includes(MARKER)) {
        writeFileSync(proguardPath, contents.replace(/\s*$/, '\n') + RULES, 'utf8');
      }
      return config;
    },
  ]);
};
