const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// TripReconcileModal
code = code.replace(/<TripReconcileModal\s+onClose=\{\(\) => setShowReconcileModal\(false\)\}\s+fetchData=\{fetchData\}\s+summary=\{summary\}\s*\/>/g, '<TripReconcileModal onClose={() => setShowReconcileModal(false)} />');

// CsvReconcileModal
code = code.replace(/<CsvReconcileModal\s+onClose=\{\(\) => setShowCsvModal\(false\)\}\s+data=\{data\}\s+csvRecords=\{csvRecords\}\s+setCsvRecords=\{setCsvRecords\}\s+fetchData=\{fetchData\}\s*\/>/g, '<CsvReconcileModal onClose={() => setShowCsvModal(false)} csvRecords={csvRecords} setCsvRecords={setCsvRecords} />');

// ExpenseModal
code = code.replace(/<ExpenseModal\s+onClose=\{\(\) => setShowExpenseModal\(false\)\}\s+monthlySettings=\{monthlySettings\}\s+fetchData=\{fetchData\}\s*\/>/g, '<ExpenseModal onClose={() => setShowExpenseModal(false)} />');

// FixedExpensesModal
code = code.replace(/<FixedExpensesModal\s+onClose=\{\(\) => setShowFixedModal\(false\)\}\s+monthlySettings=\{monthlySettings\}\s+fetchData=\{fetchData\}\s*\/>/g, '<FixedExpensesModal onClose={() => setShowFixedModal(false)} />');

// TransferModal
code = code.replace(/<TransferModal\s+onClose=\{\(\) => setShowTransferModal\(false\)\}\s+data=\{data\}\s+fetchData=\{fetchData\}\s*\/>/g, '<TransferModal onClose={() => setShowTransferModal(false)} />');

// RawJsonEditorModal
code = code.replace(/<RawJsonEditorModal\s+onClose=\{\(\) => setShowRawJsonModal\(false\)\}\s+data=\{data\}\s+fetchData=\{fetchData\}\s*\/>/g, '<RawJsonEditorModal onClose={() => setShowRawJsonModal(false)} />');

// OffsetModal
code = code.replace(/<OffsetModal\s+onClose=\{\(\) => setShowOffsetModal\(false\)\}\s+data=\{data\}\s+fetchData=\{fetchData\}\s*\/>/g, '<OffsetModal onClose={() => setShowOffsetModal(false)} />');

fs.writeFileSync('app/page.tsx', code);
console.log('Removed props from page.tsx');
