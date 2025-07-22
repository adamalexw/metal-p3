const fs = require('fs-extra');
const path = require('path');

const dest = 'c:\\metal-p3\\ui';

fs.rmSync(dest, { recursive: true, force: true });
fs.copySync('.\\dist\\apps\\ui\\browser', dest);
fs.copySync('.\\web.config', path.join(dest, 'web.config'));
