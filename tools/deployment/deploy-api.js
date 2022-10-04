const process = require('process');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const dest = 'c:\\metal-p3\\api';

fs.rmSync(dest, { recursive: true });

fs.copySync('.\\dist\\apps\\api', dest);
fs.copySync('.env', path.join(dest, '.env'));
fs.copySync('prisma', path.join(dest, 'prisma'));
fs.copySync('package.json', path.join(dest, 'package.json'));
fs.copySync('package-lock.json', path.join(dest, 'package.lock.json'));
fs.copySync('decorate-angular-cli.js', path.join(dest, 'decorate-angular-cli.js'));

process.chdir(dest);
execSync('npm install');
execSync('npx prisma generate');