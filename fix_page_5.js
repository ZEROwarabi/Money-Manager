const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

const startIdx = code.indexOf('<XAxis');
if (startIdx !== -1) {
  const endIdx = code.indexOf('</BarChart>', startIdx);
  if (endIdx !== -1) {
    const endStr = '</BarChart>\n            </ResponsiveContainer>\n          </div>\n        </div>';
    const realEnd = code.indexOf(endStr, startIdx);
    
    if (realEnd !== -1) {
      code = code.substring(0, startIdx) + code.substring(realEnd + endStr.length);
      fs.writeFileSync('app/page.tsx', code);
      console.log('Removed junk BarChart code.');
    } else {
      console.log('Found BarChart but could not find the exact end wrapper.');
    }
  } else {
    console.log('Could not find </BarChart>');
  }
} else {
  console.log('Could not find <XAxis');
}
