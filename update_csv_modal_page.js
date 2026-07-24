const fs = require('fs');

let code = fs.readFileSync('app/page.tsx', 'utf8');

// 1. Remove states
code = code.replace(/const \[bankBalanceInput, setBankBalanceInput\] = useState<string>\(''\);\n?/g, '');
code = code.replace(/const \[selectedCsvIndices, setSelectedCsvIndices\] = useState<Set<number>>\(new Set\(\)\);\n?/g, '');
code = code.replace(/const \[selectedAppIndices, setSelectedAppIndices\] = useState<Set<number>>\(new Set\(\)\);\n?/g, '');

// 2. Remove the modal JSX
const lines = code.split('\n');
const startIndex = lines.findIndex(l => l.includes('{/* CSV Reconcile Modal */}'));
let endIndex = -1;
let openBrackets = 0;

if (startIndex !== -1) {
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('(')) openBrackets += (line.match(/\(/g) || []).length;
    if (line.includes(')')) openBrackets -= (line.match(/\)/g) || []).length;
    
    if (openBrackets === 0 && i > startIndex + 10) {
      endIndex = i;
      break;
    }
  }

  if (endIndex !== -1) {
    const replacement = `      {/* CSV Reconcile Modal */}
      {showCsvModal && (
        <CsvReconcileModal
          onClose={() => setShowCsvModal(false)}
          data={data}
          csvRecords={csvRecords}
          setCsvRecords={setCsvRecords}
          fetchData={fetchData}
        />
      )}`;
      
    const newLines = [
      ...lines.slice(0, startIndex),
      replacement,
      ...lines.slice(endIndex + 1)
    ];
    code = newLines.join('\n');
  }
}

// 3. Add Import
const importStmt = "import { CsvReconcileModal } from './components/modals/CsvReconcileModal';\n";
code = code.replace(/import \{ formatCurrency/, importStmt + "import { formatCurrency");

fs.writeFileSync('app/page.tsx', code);
console.log('Successfully updated page.tsx with CsvReconcileModal');
