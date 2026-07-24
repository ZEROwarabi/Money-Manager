const fs = require('fs');

let code = fs.readFileSync('app/page.tsx', 'utf8');
const lines = code.split('\n');

const startIndex = lines.findIndex(l => l.includes('{/* Raw JSON Editor Modal */}'));
let endIndex = -1;
let openBrackets = 0;

for (let i = startIndex + 1; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('(')) openBrackets += (line.match(/\(/g) || []).length;
  if (line.includes(')')) openBrackets -= (line.match(/\)/g) || []).length;
  
  if (openBrackets === 0 && i > startIndex + 5) {
    endIndex = i;
    break;
  }
}
console.log('Start:', startIndex, 'End:', endIndex);
