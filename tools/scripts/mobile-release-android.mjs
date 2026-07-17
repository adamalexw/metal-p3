#!/usr/bin/env node
// Build a signed-with-debug-key release APK and install it on a connected
// device over USB or wireless adb. All gradle customizations (JVM 17 pin,
// memory limits, Nx workspace root, proguard keep rules) are applied by the
// config plugins listed in apps/mobile/app.json during prebuild, so the
// generated android/ folder needs no hand-edits.
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..', '..');

// Prevent OOM errors in spawned Node/Metro bundler processes by raising memory limits
process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '--max-old-space-size=4096';
// Prevent Clang frontend crashes on Windows due to OOM during React Native C++ builds
process.env.CMAKE_BUILD_PARALLEL_LEVEL = process.env.CMAKE_BUILD_PARALLEL_LEVEL || '2';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
const mobileRoot = resolve(repoRoot, 'apps', 'mobile');
const androidDir = resolve(mobileRoot, 'android');
const apkPath = resolve(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

const skipPrebuild = process.argv.includes('--no-prebuild');
const cleanPrebuild = process.argv.includes('--clean-prebuild');

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

function stopGradleDaemons() {
  if (!existsSync(androidDir)) {
    return;
  }

  const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  const result = spawnSync(gradleCmd, ['--stop'], {
    cwd: androidDir,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    console.warn('  gradlew --stop exited non-zero; continuing');
  }
}

function clearKotlinCaches() {
  const cacheTargets = [
    resolve(androidDir, 'build'),
    resolve(repoRoot, 'node_modules', 'expo-modules-core', 'android', 'build', 'kotlin'),
    resolve(repoRoot, 'node_modules', 'react-native-screens', 'android', 'build', 'kotlin'),
  ];

  for (const target of cacheTargets) {
    if (!existsSync(target)) {
      continue;
    }

    rmSync(target, { recursive: true, force: true });
  }
}

if (!skipPrebuild) {
  if (cleanPrebuild) {
    step('Stop Gradle daemons before clean prebuild');
    stopGradleDaemons();
  }

  step(cleanPrebuild ? 'Clean Expo prebuild (Android)' : 'Expo prebuild (Android)');
  const prebuildArgs = ['expo', 'prebuild', '--platform', 'android'];
  if (cleanPrebuild) {
    prebuildArgs.splice(2, 0, '--clean');
  }
  run('npx', prebuildArgs, { cwd: mobileRoot });
}

step('Build release APK (./gradlew assembleRelease)');
{
  step('Clear Kotlin build caches');
  clearKotlinCaches();

  const gradleCmd = process.platform === 'win32' ? resolve(androidDir, 'gradlew.bat') : './gradlew';
  run(
    gradleCmd,
    [
      '--no-daemon',
      '-Dkotlin.incremental=false',
      '-Dkotlin.compiler.execution.strategy=in-process',
      'assembleRelease',
    ],
    { cwd: androidDir }
  );
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

console.log(`\nRelease APK installed on ${target}: ${apkPath}`);
