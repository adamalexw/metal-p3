const { withAppBuildGradle } = require('expo/config-plugins');

// Point the React Native Gradle plugin's `root` at the Nx workspace root so
// Metro can resolve ./index.js during release bundling (export:embed runs from
// `root`, and package.json/index.js live four levels up from android/app).
module.exports = function withNxWorkspaceRoot(config) {
  return withAppBuildGradle(config, (config) => {
    const contents = config.modResults.contents;
    if (contents.includes('root = file("../../../..")')) {
      return config;
    }
    const target = '    // root = file("../../")';
    if (!contents.includes(target)) {
      throw new Error(
        'withNxWorkspaceRoot: expected commented `// root = file("../../")` line not found in android/app/build.gradle — the RN gradle plugin template may have changed.'
      );
    }
    config.modResults.contents = contents.replace(
      target,
      '    //   Set to the Nx workspace root so Metro resolves ./index.js during release bundling.\n    root = file("../../../..")'
    );
    return config;
  });
};
