const fs = require('fs');

let pageCode = fs.readFileSync('app/page.tsx', 'utf8');
const lines = pageCode.split('\n');

// 1. Remove state
const stateIdx = lines.findIndex(l => l.includes('const [transferForm, setTransferForm] = useState'));
if (stateIdx !== -1) {
  lines.splice(stateIdx, 1);
}

// 2. Remove handleTransferBudget
const handleStart = lines.findIndex(l => l.includes('const handleTransferBudget = async'));
if (handleStart !== -1) {
  let openBrackets = 0;
  let handleEnd = -1;
  for (let i = handleStart; i < lines.length; i++) {
    if (lines[i].includes('{')) openBrackets += (lines[i].match(/\{/g) || []).length;
    if (lines[i].includes('}')) openBrackets -= (lines[i].match(/\}/g) || []).length;
    if (openBrackets === 0) {
      handleEnd = i;
      break;
    }
  }
  if (handleEnd !== -1) {
    lines.splice(handleStart, handleEnd - handleStart + 1);
  }
}

// 3. Replace JSX
const jsxStart = lines.findIndex(l => l.includes('{/* Transfer Budget Modal */}'));
if (jsxStart !== -1) {
  let jsxEnd = -1;
  let openBrackets = 0;
  for (let i = jsxStart + 1; i < lines.length; i++) {
    if (lines[i].includes('(')) openBrackets += (lines[i].match(/\(/g) || []).length;
    if (lines[i].includes(')')) openBrackets -= (lines[i].match(/\)/g) || []).length;
    if (openBrackets === 0 && i > jsxStart + 5) {
      jsxEnd = i;
      break;
    }
  }
  
  if (jsxEnd !== -1) {
    const newComponent = `      {/* Transfer Budget Modal */}
      {showTransferModal && (
        <TransferModal
          onClose={() => setShowTransferModal(false)}
          fetchData={fetchData}
          currentRealMonth={currentRealMonth}
          variableCategories={variableCategories}
          uniqueCategories={uniqueCategories}
        />
      )}`;
    lines.splice(jsxStart, jsxEnd - jsxStart + 1, newComponent);
  }
}

let modifiedCode = lines.join('\n');
const importStmt = "import { TransferModal } from './components/modals/TransferModal';\n";
modifiedCode = modifiedCode.replace(/import \{ FixedExpensesModal /, importStmt + "import { FixedExpensesModal ");

fs.writeFileSync('app/page.tsx', modifiedCode);
console.log('Successfully updated page.tsx with TransferModal');
