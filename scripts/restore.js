const cp = require('child_process');
const fs = require('fs');
const content = cp.execSync('"C:\\Program Files\\Git\\bin\\git.exe" show HEAD~1:app/api/finance/route.ts').toString();
fs.writeFileSync('route_correct.ts', content);
