#!/usr/bin/env node
// Run a clean Expo prebuild for the Android app, restore the JVM 17 pin in
// android/build.gradle (which prebuild wipes), and launch run-android. Use
// this whenever native module sources change and a full rebuild is needed.
import { execSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..', '..');

// Prevent OOM errors in spawned Node/Metro bundler processes by raising memory limits
process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '--max-old-space-size=2048';
const buildGradlePath = resolve(repoRoot, 'apps', 'mobile', 'android', 'build.gradle');

const JVM17_PIN_MARKER = '// Pin every subproject\'s Kotlin compile to JVM 17';
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

function run(cmd, args) {
  const result = spawnSync(cmd, args, { cwd: repoRoot, stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    console.error(`\nCommand failed: ${cmd} ${args.join(' ')}`);
    process.exit(result.status ?? 1);
  }
}

step('Clean Expo prebuild (Android)');
run('npx', ['nx', 'run', 'mobile:prebuild', '--', '--clean', '--platform', 'android']);

step('Restore JVM 17 pin in android/build.gradle');
const original = readFileSync(buildGradlePath, 'utf8');
if (original.includes(JVM17_PIN_MARKER)) {
  console.log('  pin already present, skipping');
} else {
  const patched = original.replace(/\s*$/, '') + '\n' + JVM17_PIN;
  writeFileSync(buildGradlePath, patched, 'utf8');
  console.log(`  pin appended to ${buildGradlePath}`);
}

step('Build & install Android app');
run('npx', ['nx', 'run', 'mobile:run-android']);
