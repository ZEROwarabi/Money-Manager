const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

code = code.replace(/\(monthlyData \|\| \[\]\)\[dataIndex - 1\]\.name\.split/g, "((monthlyData || [])[dataIndex - 1]?.name || '').split");
code = code.replace(/d\.name\.split/g, "(d.name || '').split");

fs.writeFileSync('app/page.tsx', code);
