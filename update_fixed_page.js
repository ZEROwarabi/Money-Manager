const fs = require('fs');

let code = fs.readFileSync('app/page.tsx', 'utf8');

// Replace openFixedModal with setShowFixedModal(true)
code = code.replace(/onClick=\{openFixedModal\}/g, 'onClick={() => setShowFixedModal(true)}');

// Remove state
code = code.replace(/const \[tempSettings, setTempSettings\] = useState<Record<string, MonthlySettings>>\(\{\}\);\n?/g, '');

// The function blocks to remove:
// openFixedModal
const openFixedStart = code.indexOf('const openFixedModal = () => {');
if (openFixedStart !== -1) {
  let end = openFixedStart;
  let openBrackets = 0;
  for (let i = openFixedStart; i < code.length; i++) {
    if (code[i] === '{') openBrackets++;
    if (code[i] === '}') {
      openBrackets--;
      if (openBrackets === 0) {
        end = i;
        break;
      }
    }
  }
  code = code.substring(0, openFixedStart) + code.substring(end + 1);
}

// handleDeleteMonth
const delStart = code.indexOf('const handleDeleteMonth = async (monthToDelete: string) => {');
if (delStart !== -1) {
  let end = delStart;
  let openBrackets = 0;
  for (let i = delStart; i < code.length; i++) {
    if (code[i] === '{') openBrackets++;
    if (code[i] === '}') {
      openBrackets--;
      if (openBrackets === 0) {
        end = i;
        break;
      }
    }
  }
  code = code.substring(0, delStart) + code.substring(end + 1);
}

// addNextMonthToTemp
const addStart = code.indexOf('const addNextMonthToTemp = () => {');
if (addStart !== -1) {
  let end = addStart;
  let openBrackets = 0;
  for (let i = addStart; i < code.length; i++) {
    if (code[i] === '{') openBrackets++;
    if (code[i] === '}') {
      openBrackets--;
      if (openBrackets === 0) {
        end = i;
        break;
      }
    }
  }
  code = code.substring(0, addStart) + code.substring(end + 1);
}

// handleSaveAllMonthlySettings
const saveStart = code.indexOf('const handleSaveAllMonthlySettings = async () => {');
if (saveStart !== -1) {
  let end = saveStart;
  let openBrackets = 0;
  for (let i = saveStart; i < code.length; i++) {
    if (code[i] === '{') openBrackets++;
    if (code[i] === '}') {
      openBrackets--;
      if (openBrackets === 0) {
        end = i;
        break;
      }
    }
  }
  code = code.substring(0, saveStart) + code.substring(end + 1);
}

// Now replace the JSX
const lines = code.split('\n');
const jsxStart = lines.findIndex(l => l.includes('{/* Fixed Expenses / Budget Modal (Table Format) */}'));
if (jsxStart !== -1) {
  let jsxEnd = -1;
  let openBrackets = 0;
  for (let i = jsxStart + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('(')) openBrackets += (line.match(/\(/g) || []).length;
    if (line.includes(')')) openBrackets -= (line.match(/\)/g) || []).length;
    if (openBrackets === 0 && i > jsxStart + 5) {
      jsxEnd = i;
      break;
    }
  }
  if (jsxEnd !== -1) {
    const newComponent = `      {/* Fixed Expenses / Budget Modal (Table Format) */}
      {showFixedModal && (
        <FixedExpensesModal
          onClose={() => setShowFixedModal(false)}
          data={data}
          fetchData={fetchData}
          currentRealMonth={currentRealMonth}
          ignoredBudgetCategories={ignoredBudgetCategories}
          handleToggleIgnoredBudgetCategory={handleToggleIgnoredBudgetCategory}
        />
      )}`;
    lines.splice(jsxStart, jsxEnd - jsxStart + 1, newComponent);
  }
}

let modifiedCode = lines.join('\n');
const importStmt = "import { FixedExpensesModal } from './components/modals/FixedExpensesModal';\n";
modifiedCode = modifiedCode.replace(/import \{ ExpenseModal /, importStmt + "import { ExpenseModal ");

fs.writeFileSync('app/page.tsx', modifiedCode);
console.log('Successfully updated page.tsx with FixedExpensesModal');
