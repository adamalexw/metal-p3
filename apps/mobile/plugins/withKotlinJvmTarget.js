const { withProjectBuildGradle } = require('expo/config-plugins');

module.exports = function withKotlinJvmTarget(config) {
  return withProjectBuildGradle(config, async (config) => {
    const bypassCode = `
// Pin every subproject's Kotlin compile to JVM 17 so libraries that don't pin
// their own jvmTarget (e.g. react-native-image-colors) don't drift up to JDK 21
// when Android Studio ships a newer bundled JDK and break with
// "Inconsistent JVM-target compatibility".
subprojects {
  tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
    kotlinOptions {
      jvmTarget = "17"
    }
  }
  plugins.withId("com.android.library") {
    project.android {
      compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
      }
    }
  }
  plugins.withId("com.android.application") {
    project.android {
      compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
      }
    }
  }
}
`;
    
    if (!config.modResults.contents.includes('Inconsistent JVM-target compatibility')) {
      config.modResults.contents += '\n' + bypassCode;
    }
    return config;
  });
};
