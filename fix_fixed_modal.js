const fs = require('fs');

let code = fs.readFileSync('app/components/modals/FixedExpensesModal.tsx', 'utf8');

// Remove props from interface
code = code.replace(/\s*data: AppData \| null;\n/g, '');
code = code.replace(/\s*ignoredBudgetCategories: string\[\];\n/g, '');
code = code.replace(/\s*handleToggleIgnoredBudgetCategory: \(cat: string, checked: boolean\) => void;\n/g, '');

// Remove props from function signature
code = code.replace(/,\s*data\s*(?=[,}])/g, '');
code = code.replace(/,\s*ignoredBudgetCategories\s*(?=[,}])/g, '');
code = code.replace(/,\s*handleToggleIgnoredBudgetCategory\s*(?=[,}])/g, '');

// cleanup trailing comma and empty lines in destructuring
code = code.replace(/,\s*\}/g, '}');

// Inject hook destructured values
const injection = `  const { data, ignoredBudgetCategories, toggleIgnoredBudgetCategory: handleToggleIgnoredBudgetCategory } = useFinanceContext();`;
// Find the hook we injected earlier
if (code.includes('const { monthlySettings, fetchData } = useFinanceContext();')) {
  code = code.replace('const { monthlySettings, fetchData } = useFinanceContext();', injection);
} else {
  // If not there, inject after export const ... = ({ ... }) => {
  code = code.replace(/(export const FixedExpensesModal: React\.FC<FixedExpensesModalProps> = \(\{.*?\}\) => \{\n)/s, `$1${injection}\n`);
}

fs.writeFileSync('app/components/modals/FixedExpensesModal.tsx', code);
console.log('FixedExpensesModal updated.');
