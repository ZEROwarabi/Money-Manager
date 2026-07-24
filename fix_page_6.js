const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

const startIdx = code.indexOf('<XAxis');
if (startIdx !== -1) {
  const endIdx = code.indexOf('</BarChart>', startIdx);
  if (endIdx !== -1) {
    code = code.substring(0, startIdx) + code.substring(endIdx + '</BarChart>'.length);
    fs.writeFileSync('app/page.tsx', code);
    console.log('Removed junk BarChart code.');
  } else {
    console.log('Could not find </BarChart>');
  }
} else {
  console.log('Could not find <XAxis');
}
