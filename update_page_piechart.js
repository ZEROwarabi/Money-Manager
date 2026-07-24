const fs = require('fs');
let pageCode = fs.readFileSync('app/page.tsx', 'utf8');

if (!pageCode.includes('import { ExpensePieChart }')) {
  pageCode = pageCode.replace(
    /import \{ formatCurrency \} from '\.\/lib\/format';/,
    `import { ExpensePieChart } from './components/charts/ExpensePieChart';\nimport { formatCurrency } from './lib/format';`
  );
}

const match = pageCode.match(/const pieExpensesByCategory: Record<string, number> = {};[\s\S]*?const uniqueCategories = [^;]+;/);
if (match) {
  const newPieLogic = `const { generatedPieData, uniqueCategories } = React.useMemo(() => {
    const pieExpensesByCategory: Record<string, number> = {};
    if (data?.records) {
      data.records.forEach((row: Transaction) => {
        const expense = (row.expense) || 0;
        const category = row.category || 'その他';
        const month = row.month;
        const recordType = row.recordType || 'expense_normal';
        const isExcludedExpense = recordType === 'advance_payment';
        
        if (expense !== 0 && category !== '入金' && !isExcludedExpense) {
          if (!targetMonth || month === targetMonth) {
             if (!ignoredBudgetCategories.includes(category)) {
               pieExpensesByCategory[category] = (pieExpensesByCategory[category] || 0) + expense;
             }
          }
        }
      });
    }

    const genPieData = Object.keys(pieExpensesByCategory).map(key => ({
      name: key,
      value: pieExpensesByCategory[key]
    })).sort((a, b) => b.value - a.value);

    const uCategories = Array.from(new Set(['特別体験・イベント費', ...(genPieData.map(item => item.name))]));
    return { generatedPieData: genPieData, uniqueCategories: uCategories };
  }, [data?.records, targetMonth, ignoredBudgetCategories]);

  const visibleExpenseData = React.useMemo(() => {
    return generatedPieData.filter((item) => !hiddenCategories[item.name]);
  }, [generatedPieData, hiddenCategories]);`;

  pageCode = pageCode.replace(match[0], newPieLogic);
}

const jsxStart = pageCode.indexOf('<div className="glass-card">\n          <div style={{ display: \'flex\', justifyContent: \'space-between\', alignItems: \'center\', marginBottom: \'1rem\' }}>\n            <h2 className="chart-title" style={{ margin: 0 }}>支出の割合（カテゴリ別）</h2>');

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
    const newComponent = `        <ExpensePieChart
          pieChartMonth={pieChartMonth}
          setPieChartMonth={setPieChartMonth}
          currentRealMonth={currentRealMonth}
          generatedPieData={generatedPieData}
          visibleExpenseData={visibleExpenseData}
          uniqueCategories={uniqueCategories}
          hiddenCategories={hiddenCategories}
          setHiddenCategories={setHiddenCategories}
        />`;
    pageCode = pageCode.substring(0, jsxStart) + newComponent + pageCode.substring(end);
  }
}

fs.writeFileSync('app/page.tsx', pageCode);
console.log('Successfully updated page.tsx with ExpensePieChart');
