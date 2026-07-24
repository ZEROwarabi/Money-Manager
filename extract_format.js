const fs = require('fs');

fs.writeFileSync('app/lib/format.ts', "export const formatCurrency = (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;\n");

let code = fs.readFileSync('app/page.tsx', 'utf8');

const formatRegex = /const formatCurrency = \(val: number\) => `\$\{val\.toLocaleString\('en-US', \{ minimumFractionDigits: 2, maximumFractionDigits: 2 \}\)\}`;/g;

code = code.replace(formatRegex, '');

const importStmt = "import { formatCurrency } from './lib/format';\n";
code = code.replace(/import \{ toCents, calculateConfidence/, importStmt + "import { toCents, calculateConfidence");

fs.writeFileSync('app/page.tsx', code);
console.log('Successfully extracted format.ts');
