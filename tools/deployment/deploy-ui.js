const fs = require('fs-extra');
const path = require('path');

const dest = 'c:\\metal-p3\\ui';

fs.rmSync(dest, { recursive: true });
fs.copySync('.\\dist\\apps\\ui', dest);
fs.copySync('.\\web.config', path.join(dest, 'web.config'));