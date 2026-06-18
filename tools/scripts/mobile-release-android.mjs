#!/usr/bin/env node
// Build a signed-with-debug-key release APK and install it on a connected
// device over USB or wireless adb. Handles two patches that `expo prebuild
// --clean` wipes: the JVM 17 pin in android/build.gradle (see
// mobile-prebuild-android.mjs) and the `react.root` override in
// android/app/build.gradle that lets Metro resolve ./index.js from the Nx
// workspace root during the production bundle.
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..', '..');

// Prevent OOM errors in spawned Node/Metro bundler processes by raising memory limits
process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '--max-old-space-size=2048';
const mobileRoot = resolve(repoRoot, 'apps', 'mobile');
const rootBuildGradle = resolve(mobileRoot, 'android', 'build.gradle');
const appBuildGradle = resolve(mobileRoot, 'android', 'app', 'build.gradle');
const gradleProps = resolve(mobileRoot, 'android', 'gradle.properties');
const apkPath = resolve(mobileRoot, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

const skipPrebuild = process.argv.includes('--no-prebuild');

const JVM17_PIN_MARKER = "// Pin every subproject's Kotlin compile to JVM 17";
const JVM17_PIN = `
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

function step(label) {
  console.log(`\n=== ${label} ===`);
}

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: true,
    ...opts,
  });
  if (result.status !== 0) {
    console.error(`\nCommand failed: ${cmd} ${args.join(' ')}`);
    process.exit(result.status ?? 1);
  }
}

if (!skipPrebuild) {
  step('Clean Expo prebuild (Android)');
  run('npx', ['nx', 'run', 'mobile:prebuild', '--', '--clean', '--platform', 'android']);
}

step('Restore JVM 17 pin in android/build.gradle');
{
  const original = readFileSync(rootBuildGradle, 'utf8');
  if (original.includes(JVM17_PIN_MARKER)) {
    console.log('  pin already present, skipping');
  } else {
    const patched = original.replace(/\s*$/, '') + '\n' + JVM17_PIN;
    writeFileSync(rootBuildGradle, patched, 'utf8');
    console.log(`  pin appended to ${rootBuildGradle}`);
  }
}

step('Override react.root → workspace root in app/build.gradle');
{
  const original = readFileSync(appBuildGradle, 'utf8');
  if (original.includes('root = file("../../../..")')) {
    console.log('  override already present, skipping');
  } else {
    const target = '    // root = file("../../")';
    if (!original.includes(target)) {
      console.error(`  could not find expected commented root line in ${appBuildGradle}`);
      process.exit(1);
    }
    const patched = original.replace(target, '     //   Set to the Nx workspace root so Metro resolves ./index.js during release bundling.\n    root = file("../../../..")');
    writeFileSync(appBuildGradle, patched, 'utf8');
    console.log(`  override applied to ${appBuildGradle}`);
  }
}

step('Tune gradle.properties for build memory headroom');
{
  const original = readFileSync(gradleProps, 'utf8');
  // Expo SDK 54 + Kotlin 2.x compiles need headroom, but the Expo template's
  // 2 GB Gradle heap OOMs on :expo-modules-core:compileReleaseKotlin. 4 GB for
  // Gradle + 2 GB for an out-of-process Kotlin daemon is enough to finish the
  // build without starving the OS into swap. Disable Gradle's parallel project
  // execution and cap workers at 2 so a release build doesn't flatline the
  // machine.
  const additions = [
    ['reactNativeArchitectures', 'arm64-v8a'],
    ['org.gradle.jvmargs', '-Xmx2g -XX:MaxMetaspaceSize=384m -Dfile.encoding=UTF-8'],
    ['kotlin.daemon.jvmargs', '-Xmx1g -XX:MaxMetaspaceSize=256m'],
    ['kotlin.compiler.execution.strategy', 'daemon'],
    ['org.gradle.workers.max', '1'],
    ['org.gradle.parallel', 'false'],
  ];
  let patched = original;
  for (const [key, value] of additions) {
    const line = `${key}=${value}`;
    if (patched.includes(line)) {
      console.log(`  ${key} already set, skipping`);
      continue;
    }
    if (new RegExp(`^${key.replace(/\./g, '\\.')}=`, 'm').test(patched)) {
      patched = patched.replace(new RegExp(`^${key.replace(/\./g, '\\.')}=.*$`, 'm'), line);
      console.log(`  ${key} updated`);
    } else {
      patched = patched.replace(/\s*$/, '') + `\n${line}\n`;
      console.log(`  ${key} appended`);
    }
  }
  if (patched !== original) {
    writeFileSync(gradleProps, patched, 'utf8');
  }
}

step('Build release APK (./gradlew assembleRelease)');
{
  const androidDir = resolve(mobileRoot, 'android');
  const gradleCmd = process.platform === 'win32' ? resolve(androidDir, 'gradlew.bat') : './gradlew';
  run(gradleCmd, ['assembleRelease'], { cwd: androidDir });
}

if (!existsSync(apkPath)) {
  console.error(`\nExpected APK not found at ${apkPath}`);
  process.exit(1);
}

step('Install APK on connected device');
const devices = (() => {
  try {
    return execSync('adb devices', { encoding: 'utf8' });
  } catch (err) {
    console.error(`  failed to query adb: ${err.message}`);
    process.exit(1);
  }
})();
const online = devices
  .split('\n')
  .slice(1)
  .map((line) => line.trim())
  .filter((line) => line.endsWith('\tdevice'))
  .map((line) => line.split('\t')[0]);
if (online.length === 0) {
  console.error('  no online adb devices found. APK is at:');
  console.error(`    ${apkPath}`);
  process.exit(1);
}
const target = online[0];
if (online.length > 1) {
  console.log(`  multiple devices online (${online.join(', ')}); installing on ${target}`);
}
run('adb', ['-s', target, 'install', '-r', '-i', 'com.android.vending', apkPath]);

step('Stop Gradle daemons (free JVM memory)');
{
  const androidDir = resolve(mobileRoot, 'android');
  const gradleCmd = process.platform === 'win32' ? resolve(androidDir, 'gradlew.bat') : './gradlew';
  // Best-effort: don't fail the script if stopping the daemon errors.
  const result = spawnSync(gradleCmd, ['--stop'], {
    cwd: androidDir,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    console.warn('  gradlew --stop exited non-zero; continuing');
  }
}

console.log(`\nRelease APK installed on ${target}: ${apkPath}`);
