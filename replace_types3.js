const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

code = code.replace(/useState<Record<string, any>>\(\{\}\)/g, 'useState<Record<string, MonthlySettings>>({})'); 
code = code.replace(/\): any\[\]\[\] =>/g, '): Transaction[][] =>');
code = code.replace(/data\.expenseData\.map\(\(d: any\)/g, 'data.expenseData.map((d: ExpenseData)');
code = code.replace(/const clone: Record<string, any> = \{\};/g, 'const clone: Record<string, MonthlySettings> = {};');
code = code.replace(/clone\[month\]\.fixedExpenses\.find\(\(f: any\)/g, 'clone[month].fixedExpenses.find((f: FixedExpense)');
code = code.replace(/clone\[currentRealMonth\]\.fixedExpenses\.find\(\(f: any\)/g, 'clone[currentRealMonth].fixedExpenses.find((f: FixedExpense)');
code = code.replace(/accountBalances\?\.find\(\(a: any\)/g, 'accountBalances?.find((a: AccountBalance)');
code = code.replace(/expenseData\.map\(\(item: any\)/g, 'expenseData.map((item: ExpenseData)');
code = code.replace(/s\.fixedExpenses\.map\(\(f: any\)/g, 's.fixedExpenses.map((f: FixedExpense)');
code = code.replace(/data\.records\.forEach\(\(row: any\)/g, 'data.records.forEach((row: Transaction)');
code = code.replace(/generatedPieData\.filter\(\(item: any\)/g, 'generatedPieData.filter((item: {name: string; value: number})');
code = code.replace(/generatedPieData\.map\(\(item: any\)/g, 'generatedPieData.map((item: {name: string; value: number})');
code = code.replace(/categoryBudgets\.filter\(\(c: any\)/g, 'categoryBudgets.filter((c: CategoryBudget)');
code = code.replace(/variableCategories\.reduce\(\(sum: number, c: any\)/g, 'variableCategories.reduce((sum: number, c: CategoryBudget)');
code = code.replace(/monthlyData\?\.find\(\(d: any\)/g, 'monthlyData?.find((d: MonthlyData)');
code = code.replace(/lastMonthSettings\.fixedExpenses\?\.reduce\(\(sum: number, f: any\)/g, 'lastMonthSettings.fixedExpenses?.reduce((sum: number, f: FixedExpense)');
code = code.replace(/variableCategories\.map\(\(c: any\)/g, 'variableCategories.map((c: CategoryBudget)');
code = code.replace(/import \{ Transaction, AppData, WishlistItem, RecordType, MonthlySettings \} from '\.\/types';/g, "import { Transaction, AppData, WishlistItem, RecordType, MonthlySettings, ExpenseData, FixedExpense, AccountBalance, CategoryBudget, MonthlyData } from './types';");


fs.writeFileSync('app/page.tsx', code);
console.log('done');
