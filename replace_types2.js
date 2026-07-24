const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

code = code.replace(/useState<any>\(\{\}\)/g, 'useState<Record<string, any>>({})'); 
code = code.replace(/bankRecords\.filter\(\(_: any, idx: number\)/g, 'bankRecords.filter((_: Transaction, idx: number)');
code = code.replace(/const foodCat = data\?\.categoryBudgets\?\.find\(\(c: any\) => c\.name === '食費'\);/g, "const foodCat = data?.categoryBudgets?.find((c: CategoryBudget & {name?: string}) => c.category === '食費' || c.name === '食費');");
code = code.replace(/const entertainmentCat = data\?\.categoryBudgets\?\.find\(\(c: any\) => c\.name === '娯楽・リフレッシュ費'\);/g, "const entertainmentCat = data?.categoryBudgets?.find((c: CategoryBudget & {name?: string}) => c.category === '娯楽・リフレッシュ費' || c.name === '娯楽・リフレッシュ費');");
code = code.replace(/const \[monthlySettings, setMonthlySettings\] = useState<any>\(\{\}\);/g, 'const [monthlySettings, setMonthlySettings] = useState<Record<string, MonthlySettings>>({});');
code = code.replace(/const \[tempSettings, setTempSettings\] = useState<Record<string, any>>\(\{\}\);/g, 'const [tempSettings, setTempSettings] = useState<Record<string, MonthlySettings>>({});');

// also replace CategoryBudget in types import if not present
if (!code.includes('CategoryBudget')) {
  code = code.replace(
    "import { Transaction, AppData, WishlistItem, RecordType } from './types';",
    "import { Transaction, AppData, WishlistItem, RecordType, CategoryBudget, MonthlySettings } from './types';"
  );
} else {
  code = code.replace(
    "import { Transaction, AppData, WishlistItem, RecordType } from './types';",
    "import { Transaction, AppData, WishlistItem, RecordType, MonthlySettings } from './types';"
  );
}

fs.writeFileSync('app/page.tsx', code);
console.log('done');
