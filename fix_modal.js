const fs = require('fs');
let code = fs.readFileSync('app/components/modals/ExpenseModal.tsx', 'utf8');

code = code.replace(/setShowExpenseModal\(false>/g, 'onClose()}');
code = code.replace(/e\.stopPropagation\(>/g, 'e.stopPropagation()}');
code = code.replace(/value=\{expenseForm\.date\.replace\(\/\\\\\/\\/g, '-'/g, "value={expenseForm.date.replace(/\\\\//g, '-')}");
code = code.replace(/onChange=\{e => setExpenseForm\(\{\.\.\.expenseForm, date: e\.target\.value\.replace\(\/-\/g, '\/'/g, "onChange={e => setExpenseForm({...expenseForm, date: e.target.value.replace(/-/g, '/')})}");

// Actually, let's just do simple string replacements since regex is tricky with these characters
code = code.split('onClick={() => setShowExpenseModal(false>').join('onClick={onClose}');
code = code.split('onClick={e => e.stopPropagation(>').join('onClick={e => e.stopPropagation()}');
code = code.split("value={expenseForm.date.replace(/\\//g, '-' ").join("value={expenseForm.date.replace(/\\//g, '-')} ");
code = code.split("onChange={e => setExpenseForm({...expenseForm, date: e.target.value.replace(/-/g, '/' ").join("onChange={e => setExpenseForm({...expenseForm, date: e.target.value.replace(/-/g, '/')})} ");
code = code.split("{isNewCategory ? (").join("{isNewCategory ? (");

// Wait, looking at the code I read earlier:
// <input type="date" value={expenseForm.date.replace(/\//g, '-' onChange={...
// It was literally `value={expenseForm.date.replace(/\//g, '-'` without closing brace.
// Let's replace manually by looking at the file and re-writing the corrupted parts.

fs.writeFileSync('app/components/modals/ExpenseModal.tsx', code);
