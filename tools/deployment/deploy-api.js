const process = require('process');
const fs = require('fs-extra');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const dest = 'c:\\metal-p3\\api';

// Kill any process holding port 3333 before copying
try {
  const netstat = execSync('netstat -ano', { encoding: 'utf8' });
  const match = netstat.split('\n').find((line) => line.includes(':3333') && line.includes('LISTENING'));
  if (match) {
    const pid = match.trim().split(/\s+/).pop();
    console.log(`Killing process on port 3333 (PID ${pid})...`);
    execSync(`taskkill /F /PID ${pid}`, { stdio: 'inherit' });
  }
} catch (e) {
  // No process on port 3333 — safe to continue
}

// Use robocopy to overwrite dist files in place — it has native Windows retry/wait logic
// for locked files and does not require deleting the destination first.
// /E = copy subdirs, /IS + /IT = overwrite all files regardless of timestamp/size
// /R:10 /W:5 = retry up to 10 times, wait 5s between retries
// /NP = no progress output; robocopy exit codes 0-7 are all success states
console.log('Copying API files...');
const result = spawnSync('robocopy', ['.\\dist\\apps\\api', dest, '/E', '/IS', '/IT', '/R:10', '/W:5', '/NP'], {
  stdio: 'inherit',
  shell: true,
});
if (result.status >= 8) {
  throw new Error(`robocopy failed with exit code ${result.status}`);
}

// Copy and update .env for production database path
const envSrcContent = fs.readFileSync('.env', 'utf8');
const envDestContent = envSrcContent.replace(/DATABASE_URL=.*/, 'DATABASE_URL="file:C:/metal-p3/data/prod.db"');
fs.writeFileSync(path.join(dest, '.env'), envDestContent);
fs.copySync('prisma', path.join(dest, 'prisma'));
fs.copySync('prisma.config.ts', path.join(dest, 'prisma.config.ts'));
fs.copySync('package.json', path.join(dest, 'package.json'));
fs.copySync('package-lock.json', path.join(dest, 'package-lock.json')); // Fixed typo in filename as well
fs.copySync('decorate-angular-cli.js', path.join(dest, 'decorate-angular-cli.js'));

process.chdir(dest);
execSync('npm install', { stdio: 'inherit' });
execSync('npx prisma generate');
