const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

code = code.replace(/^\s*fetchData=\{fetchData\}\r?\n/gm, '');
code = code.replace(/^\s*monthlySettings=\{monthlySettings\}\r?\n/gm, '');
code = code.replace(/^\s*summary=\{summary\}\r?\n/gm, '');
code = code.replace(/^\s*data=\{data\}\r?\n/gm, '');

fs.writeFileSync('app/page.tsx', code);
console.log('Removed global prop drill lines.');
