#!/usr/bin/env node
// Run a clean Expo prebuild for the Android app and launch run-android.
// All gradle customizations (JVM 17 pin, memory limits, Nx workspace root,
// proguard keep rules) are applied by the config plugins listed in
// apps/mobile/app.json, so the generated android/ folder needs no hand-edits.
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..', '..');

// Prevent OOM errors in spawned Node/Metro bundler processes by raising memory limits
process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '--max-old-space-size=4096';

function step(label) {
  console.log(`\n=== ${label} ===`);
}

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { cwd: repoRoot, stdio: 'inherit', shell: true, ...opts });
  if (result.status !== 0) {
    console.error(`\nCommand failed: ${cmd} ${args.join(' ')}`);
    process.exit(result.status ?? 1);
  }
}

step('Clean Expo prebuild (Android)');
run('npx', ['nx', 'run', 'mobile:prebuild', '--', '--clean', '--platform', 'android']);

step('Build & install Android app');
run('npx', ['nx', 'run', 'mobile:run-android']);
