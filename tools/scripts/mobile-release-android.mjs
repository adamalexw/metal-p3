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

// Ninja fails with "Filename longer than 260 characters" (MAX_PATH) when the
// repo path is long — git worktrees under C:\source\wt\ — because codegen
// object paths embed the repo path twice. Re-exec from a subst drive so the
// root shrinks to three characters.
if (process.platform === 'win32' && repoRoot.length > 25) {
  const drive = substDriveFor(repoRoot);
  if (drive) {
    console.log(`Repo path too long for the native build; re-running from ${drive.letter}:\\ (subst of ${repoRoot})`);
    const result = spawnSync(
      process.execPath,
      [resolve(`${drive.letter}:\\`, 'tools', 'scripts', 'mobile-release-android.mjs'), ...process.argv.slice(2)],
      { cwd: `${drive.letter}:\\`, stdio: 'inherit' },
    );
    if (drive.created) {
      try {
        execSync(`subst ${drive.letter}: /D`);
      } catch {
        // leaving the mapping behind is harmless
      }
    }
    process.exit(result.status ?? 1);
  }
  console.warn('No free drive letter to subst; the native build may fail with MAX_PATH errors.');
}

function substDriveFor(target) {
  const mappings = execSync('subst', { encoding: 'utf8' })
    .split(/\r?\n/)
    .map((line) => /^([A-Za-z]):\\: => (.+)$/.exec(line.trim()))
    .filter(Boolean);
  const normalize = (p) => resolve(p).replace(/[\\/]+$/, '').toLowerCase();
  const existing = mappings.find((m) => normalize(m[2]) === normalize(target));
  if (existing) {
    return { letter: existing[1].toUpperCase(), created: false };
  }
  const taken = new Set(mappings.map((m) => m[1].toUpperCase()));
  for (const letter of 'ZYXWVUTSRQPONMLKJIHG') {
    if (taken.has(letter) || existsSync(`${letter}:\\`)) {
      continue;
    }
    execSync(`subst ${letter}: "${target}"`);
    return { letter, created: true };
  }
  return null;
}

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

// Quote tokens with whitespace so the joined shell command stays intact
const quote = (s) => (/\s/.test(s) ? `"${s}"` : s);

function run(cmd, args, opts = {}) {
  const command = [cmd, ...args].map(quote).join(' ');
  const result = spawnSync(command, {
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
  const result = spawnSync(`${quote(gradleCmd)} --stop`, {
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
  run(gradleCmd, ['--no-daemon', '-Dkotlin.incremental=false', '-Dkotlin.compiler.execution.strategy=in-process', 'assembleRelease'], { cwd: androidDir });
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
