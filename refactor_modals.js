const fs = require('fs');

const contextImport = `import { useFinanceContext } from '../../context/FinanceContext';`;

function processModal(filePath, propsToRemove, hookInjection) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Add context import
  if (!code.includes('useFinanceContext')) {
    code = code.replace(
      /(import .*?from '.*?';\n)(?!import)/,
      `$1${contextImport}\n`
    );
  }

  // Remove props from Interface
  for (const prop of propsToRemove) {
    const regex = new RegExp(`\\s*${prop}:\\s*.*?;\\n`);
    code = code.replace(regex, '\n');
  }

  // Remove props from destructuring argument
  for (const prop of propsToRemove) {
    const regex = new RegExp(`\\s*,?\\s*${prop}(?=\\s*[,}])`, 'g');
    code = code.replace(regex, '');
  }
  // cleanup trailing comma if any
  code = code.replace(/,\s*\}/g, '}');
  code = code.replace(/\{\s*,/g, '{');

  // Inject hook
  const componentStart = code.match(/export const [A-Za-z]+: React\.FC<.*?> = \(\{.*?\}\) => \{\n/s);
  if (componentStart) {
    if (!code.includes(hookInjection.trim())) {
      code = code.replace(
        componentStart[0],
        componentStart[0] + `  ${hookInjection}\n`
      );
    }
  }

  fs.writeFileSync(filePath, code);
}

// 1. TripReconcileModal
processModal(
  'app/components/modals/TripReconcileModal.tsx',
  ['fetchData', 'summary'],
  `const { data, fetchData } = useFinanceContext();\n  const summary = data?.summary;`
);

// 2. CsvReconcileModal
processModal(
  'app/components/modals/CsvReconcileModal.tsx',
  ['data', 'fetchData'],
  `const { data, fetchData } = useFinanceContext();`
);

// 3. ExpenseModal
processModal(
  'app/components/modals/ExpenseModal.tsx',
  ['monthlySettings', 'fetchData'],
  `const { monthlySettings, fetchData } = useFinanceContext();`
);

// 4. FixedExpensesModal
processModal(
  'app/components/modals/FixedExpensesModal.tsx',
  ['monthlySettings', 'fetchData'],
  `const { monthlySettings, fetchData } = useFinanceContext();`
);

// 5. TransferModal
processModal(
  'app/components/modals/TransferModal.tsx',
  ['data', 'fetchData'],
  `const { data, fetchData } = useFinanceContext();`
);

// 6. RawJsonEditorModal
processModal(
  'app/components/modals/RawJsonEditorModal.tsx',
  ['data', 'fetchData'],
  `const { data, fetchData } = useFinanceContext();`
);

// 7. OffsetModal
processModal(
  'app/components/modals/OffsetModal.tsx',
  ['data', 'fetchData'],
  `const { data, fetchData } = useFinanceContext();`
);

console.log('Modals refactored successfully.');
