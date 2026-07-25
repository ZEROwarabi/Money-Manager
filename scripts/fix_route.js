const fs = require('fs');
let code = fs.readFileSync('app/api/finance/route.ts', 'utf8');

const oldFn = code.substring(code.indexOf('async function readDB()'), code.indexOf('async function writeDB'));
const newFn = `async function readDB() {
  let parsed = { 
    records: [], 
    monthlySettings: {},
    accounts: [
      { id: 'main', name: 'メイン口座' },
      { id: 'savings', name: '貯金口座' }
    ]
  };

  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    const p = JSON.parse(data);
    if (p.monthlySettings) parsed.monthlySettings = p.monthlySettings;
    if (p.accounts) parsed.accounts = p.accounts;
    if (p.categoryBudgets) parsed.categoryBudgets = p.categoryBudgets;
    if (p.wishlist) parsed.wishlist = p.wishlist;
    if (p.ignoredBudgetCategories) parsed.ignoredBudgetCategories = p.ignoredBudgetCategories;
  } catch (error) {
    console.warn('Local db.json not readable, using fallback for settings:', error);
  }

  try {
    const supabase = getSupabase();
    const { data: txs, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: true });
    if (error) {
      console.error('Supabase fetch error:', error);
    }
    if (txs) {
      parsed.records = txs.map(t => ({
        ...t,
        recordType: t.record_type,
        expense: Number(t.expense),
        income: Number(t.income)
      }));
    }
  } catch (error) {
    console.error('Supabase connection error in readDB:', error);
  }

  return parsed;
}

`;

code = code.replace(oldFn, newFn);
fs.writeFileSync('app/api/finance/route.ts', code);
console.log("Successfully replaced readDB");
