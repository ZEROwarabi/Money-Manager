const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

code = code.replace(/!c\.name\.includes/g, "!(c.name || '').includes");
code = code.replace(/c\.name\.includes/g, "(c.name || '').includes");

fs.writeFileSync('app/page.tsx', code);
console.log('done');
