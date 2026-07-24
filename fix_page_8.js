const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

code = code.replace(/<\/section>\s*<div className="glass-card">\s*<h2 className="chart-title">先月の振り返り/, '<div className="glass-card">\n        <h2 className="chart-title">先月の振り返り');

fs.writeFileSync('app/page.tsx', code);
console.log('Fixed unmatched section tag.');
