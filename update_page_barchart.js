const fs = require('fs');
let pageCode = fs.readFileSync('app/page.tsx', 'utf8');

// 1. Add import
if (!pageCode.includes('import { MonthlyBarChart }')) {
  pageCode = pageCode.replace(
    /import \{ ExpensePieChart \} from '\.\/components\/charts\/ExpensePieChart';/,
    `import { ExpensePieChart } from './components/charts/ExpensePieChart';\nimport { MonthlyBarChart } from './components/charts/MonthlyBarChart';`
  );
}

// 2. Remove hiddenBars state
pageCode = pageCode.replace(/const \[hiddenBars, setHiddenBars\] = useState<Record<string, boolean>>\(\{ '収入': true, 'ホームステイ等、必要経費': true \}\);\n\s*/g, '');

// 3. Replace JSX
const jsxStart = pageCode.indexOf('<div className="glass-card">\n          <h2 className="chart-title">月別推移</h2>');

if (jsxStart !== -1) {
  let end = -1;
  let openBrackets = 0;
  for (let i = jsxStart; i < pageCode.length; i++) {
    if (pageCode.substring(i, i + 4) === '<div') openBrackets++;
    if (pageCode.substring(i, i + 5) === '</div') {
      openBrackets--;
      if (openBrackets === 0) {
        end = i + 6;
        break;
      }
    }
  }

  if (end !== -1) {
    const newComponent = `        <MonthlyBarChart 
          monthlyData={data?.monthlyData || []} 
          expenseData={data?.expenseData || []} 
        />`;
    pageCode = pageCode.substring(0, jsxStart) + newComponent + pageCode.substring(end);
  }
}

fs.writeFileSync('app/page.tsx', pageCode);
console.log('Successfully updated page.tsx with MonthlyBarChart');
