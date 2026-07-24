const fs = require('fs');

let code = fs.readFileSync('app/page.tsx', 'utf8');
const lines = code.split('\n');

const startIndex = lines.findIndex(l => l.includes('{/* Expense Modal */}'));
const endIndex = 1588;

const handleAddExpenseStart = lines.findIndex(l => l.includes('const handleAddExpense = async'));
let handleAddExpenseEnd = -1;
let openBrackets = 0;

for (let i = handleAddExpenseStart; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('{')) openBrackets += (line.match(/\{/g) || []).length;
  if (line.includes('}')) openBrackets -= (line.match(/\}/g) || []).length;
  
  if (openBrackets === 0) {
    handleAddExpenseEnd = i;
    break;
  }
}

const handleAddExpenseJSX = lines.slice(handleAddExpenseStart, handleAddExpenseEnd + 1).join('\n');
const modalJSX = lines.slice(startIndex, endIndex + 1).join('\n');

const modalCode = `import React from 'react';

interface ExpenseModalProps {
  onClose: () => void;
  fetchData: () => void;
  expenseForm: { date: string; category: string; description: string; amount: string; recordType: string; };
  setExpenseForm: React.Dispatch<React.SetStateAction<any>>;
  isNewCategory: boolean;
  setIsNewCategory: React.Dispatch<React.SetStateAction<boolean>>;
  newCategoryName: string;
  setNewCategoryName: React.Dispatch<React.SetStateAction<string>>;
  wishlistIdToDeleteOnAdd: string | null;
  setWishlistIdToDeleteOnAdd: React.Dispatch<React.SetStateAction<string | null>>;
  uniqueCategories: string[];
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  onClose,
  fetchData,
  expenseForm,
  setExpenseForm,
  isNewCategory,
  setIsNewCategory,
  newCategoryName,
  setNewCategoryName,
  wishlistIdToDeleteOnAdd,
  setWishlistIdToDeleteOnAdd,
  uniqueCategories
}) => {

  ${handleAddExpenseJSX.replace(/setShowExpenseModal\(false\);/g, 'onClose();')}

  return (
    <>
      ${modalJSX.replace(/\{showExpenseModal && \(/g, '').replace(/\)\}/g, '').replace(/onClick=\{\(\) => setShowExpenseModal\(false\)\}/g, 'onClick={onClose}').trim()}
    </>
  );
};
`;

fs.writeFileSync('app/components/modals/ExpenseModal.tsx', modalCode);

// Modify page.tsx
const newLines = [...lines];
newLines.splice(startIndex, endIndex - startIndex + 1, `      {/* Expense Modal */}
      {showExpenseModal && (
        <ExpenseModal
          onClose={() => setShowExpenseModal(false)}
          fetchData={fetchData}
          expenseForm={expenseForm}
          setExpenseForm={setExpenseForm}
          isNewCategory={isNewCategory}
          setIsNewCategory={setIsNewCategory}
          newCategoryName={newCategoryName}
          setNewCategoryName={setNewCategoryName}
          wishlistIdToDeleteOnAdd={wishlistIdToDeleteOnAdd}
          setWishlistIdToDeleteOnAdd={setWishlistIdToDeleteOnAdd}
          uniqueCategories={uniqueCategories}
        />
      )}`);

// Remove handleAddExpense from page.tsx
newLines.splice(handleAddExpenseStart, handleAddExpenseEnd - handleAddExpenseStart + 1);

let modifiedCode = newLines.join('\n');
const importStmt = "import { ExpenseModal } from './components/modals/ExpenseModal';\n";
modifiedCode = modifiedCode.replace(/import \{ CsvReconcileModal /, importStmt + "import { CsvReconcileModal ");

fs.writeFileSync('app/page.tsx', modifiedCode);
console.log('ExpenseModal extracted successfully.');
