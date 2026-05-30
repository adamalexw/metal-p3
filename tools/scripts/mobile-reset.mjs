#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..', '..');
const METRO_PORTS = [8081, 19000, 19001, 19002];

function killPortWindows(port) {
  let output;
  try {
    output = execSync(`netstat -ano -p tcp`, { encoding: 'utf8' });
  } catch {
    return;
  }
  const pids = new Set();
  for (const line of output.split('\n')) {
    if (!line.includes('LISTENING')) continue;
    const match = line.match(/[:\s](\d+)\s+\S+:\S+\s+LISTENING\s+(\d+)/);
    if (!match) continue;
    if (Number(match[1]) !== port) continue;
    pids.add(match[2]);
  }
  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      console.log(`  killed PID ${pid} on port ${port}`);
    } catch {
      console.warn(`  could not kill PID ${pid} on port ${port}`);
    }
  }
}

function killPortPosix(port) {
  let pids;
  try {
    pids = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  } catch {
    return;
  }
  for (const pid of pids) {
    try {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
      console.log(`  killed PID ${pid} on port ${port}`);
    } catch {
      console.warn(`  could not kill PID ${pid} on port ${port}`);
    }
  }
}

const killPort = process.platform === 'win32' ? killPortWindows : killPortPosix;
for (const port of METRO_PORTS) killPort(port);

const targets = [
  join(repoRoot, 'apps', 'mobile', '.expo'),
  join(repoRoot, 'apps', 'mobile', 'android', 'build', 'generated', 'autolinking'),
  join(repoRoot, 'node_modules', '.cache'),
  join(tmpdir(), 'metro-cache'),
  join(tmpdir(), 'haste-map-metro'),
  join(tmpdir(), 'react-native-packager-cache-' + (process.env.USER ?? process.env.USERNAME ?? 'user')),
];

// Metro 0.83+ writes per-project file maps directly under tmpdir() as `metro-file-map-<hash>-<hash>` files.
// Glob them dynamically so a project root rename doesn't leave stale indexes behind.
const tmp = tmpdir();
if (existsSync(tmp)) {
  for (const entry of readdirSync(tmp)) {
    if (entry.startsWith('metro-file-map-')) {
      targets.push(join(tmp, entry));
    }
  }
}

let removed = 0;
for (const target of targets) {
  if (existsSync(target)) {
    try {
      const isDir = statSync(target).isDirectory();
      rmSync(target, { recursive: isDir, force: true, maxRetries: 3 });
      console.log(`  removed ${target}`);
      removed++;
    } catch (err) {
      console.warn(`  skipped ${target}: ${err.message}`);
    }
  }
}

console.log(`mobile-reset: cleared ${removed}/${targets.length} cache locations`);
