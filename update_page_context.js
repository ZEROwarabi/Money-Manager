const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// Replace imports
code = code.replace(
  /import \{ useFinanceData \} from '\.\/hooks\/useFinanceData';/,
  `import { useFinanceData } from './hooks/useFinanceData';\nimport { FinanceDataProvider, useFinanceContext } from './context/FinanceContext';`
);

// Replace default export and hook usage
code = code.replace(
  /export default function Dashboard\(\) \{[\s\S]*?const \{ (.*?) \} = useFinanceData\(\);/,
  `export default function Page() {
  return (
    <FinanceDataProvider>
      <DashboardContent />
    </FinanceDataProvider>
  );
}

function DashboardContent() {
  const { $1 } = useFinanceContext();`
);

fs.writeFileSync('app/page.tsx', code);
console.log('Updated page.tsx context wrapper.');
