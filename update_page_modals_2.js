const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// For each modal, remove the specific props if they exist in the tag.
code = code.replace(/<TripReconcileModal([^>]*?)\s+fetchData=\{fetchData\}/g, '<TripReconcileModal$1');
code = code.replace(/<TripReconcileModal([^>]*?)\s+summary=\{summary\}/g, '<TripReconcileModal$1');

code = code.replace(/<CsvReconcileModal([^>]*?)\s+data=\{data\}/g, '<CsvReconcileModal$1');
code = code.replace(/<CsvReconcileModal([^>]*?)\s+fetchData=\{fetchData\}/g, '<CsvReconcileModal$1');

code = code.replace(/<ExpenseModal([^>]*?)\s+monthlySettings=\{monthlySettings\}/g, '<ExpenseModal$1');
code = code.replace(/<ExpenseModal([^>]*?)\s+fetchData=\{fetchData\}/g, '<ExpenseModal$1');

code = code.replace(/<FixedExpensesModal([^>]*?)\s+monthlySettings=\{monthlySettings\}/g, '<FixedExpensesModal$1');
code = code.replace(/<FixedExpensesModal([^>]*?)\s+fetchData=\{fetchData\}/g, '<FixedExpensesModal$1');

code = code.replace(/<TransferModal([^>]*?)\s+data=\{data\}/g, '<TransferModal$1');
code = code.replace(/<TransferModal([^>]*?)\s+fetchData=\{fetchData\}/g, '<TransferModal$1');

code = code.replace(/<RawJsonEditorModal([^>]*?)\s+data=\{data\}/g, '<RawJsonEditorModal$1');
code = code.replace(/<RawJsonEditorModal([^>]*?)\s+fetchData=\{fetchData\}/g, '<RawJsonEditorModal$1');

code = code.replace(/<OffsetModal([^>]*?)\s+data=\{data\}/g, '<OffsetModal$1');
code = code.replace(/<OffsetModal([^>]*?)\s+fetchData=\{fetchData\}/g, '<OffsetModal$1');

fs.writeFileSync('app/page.tsx', code);
console.log('Removed specific props from page.tsx');
