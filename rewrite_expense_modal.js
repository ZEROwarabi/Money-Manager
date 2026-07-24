const fs = require('fs');

const modalCode = `import React from 'react';
import { RecordType } from '../../types';

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
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = isNewCategory ? newCategoryName : expenseForm.category;
    if (!finalCategory) {
      alert("カテゴリを入力してください。");
      return;
    }
    
    const payload = { ...expenseForm, category: finalCategory };
    
    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_expense', payload })
      });
      if (wishlistIdToDeleteOnAdd) {
        await fetch('/api/finance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_wishlist', payload: { id: wishlistIdToDeleteOnAdd } })
        });
        setWishlistIdToDeleteOnAdd(null);
      }

      alert('支出を追加しました！');
      onClose();
      fetchData();
      setIsNewCategory(false);
      setNewCategoryName('');
      setExpenseForm({ date: expenseForm.date, category: expenseForm.category, description: '', amount: '', recordType: 'expense_normal' });
    } catch (err) {
      alert('エラーが発生しました');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="chart-title">支出を入力</h2>
        <form onSubmit={handleAddExpense} className="form-container">
          <label>
            日付
            <input 
              type="date" 
              value={expenseForm.date.replace(/\\//g, '-')} 
              onChange={e => setExpenseForm({...expenseForm, date: e.target.value.replace(/-/g, '/')})} 
              required 
            />
          </label>
          <label>
            カテゴリ
            {!isNewCategory ? (
              <select 
                value={expenseForm.category} 
                onChange={e => {
                  if (e.target.value === 'new') {
                    setIsNewCategory(true);
                  } else {
                    setExpenseForm({...expenseForm, category: e.target.value});
                  }
                }} 
                required
              >
                {uniqueCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                <option value="new">+ 新しいカテゴリを入力</option>
              </select>
            ) : (
              <div style={{ display: 'flex', gap: '5px' }}>
                <input type="text" placeholder="新しいカテゴリ名" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} required style={{ flex: 1 }} />
                <button type="button" onClick={() => setIsNewCategory(false)} className="action-button secondary" style={{ padding: '0.5rem', marginTop: '0.5rem' }}>戻す</button>
              </div>
            )}
          </label>
          <label>
            処理タイプ (スマートエッジケース)
            <select value={expenseForm.recordType} onChange={e => setExpenseForm({...expenseForm, recordType: e.target.value})} required>
              <option value="expense_normal">通常支出</option>
              <option value="trip_sandbox">🎒 旅行・イベント一時プール（隔離保留）</option>
              <option value="advance_payment">🤝 友人の立替（予算から除外）</option>
              <option value="refund">↩️ 返金・キャンセル（予算復活）</option>
              <option value="income_allowance">💰 入金（仕送り）</option>
              <option value="income_special">💰 入金（特別資産・大型送金）</option>
              <option value="advance_recovery">🤝 入金（立替の回収・清算）</option>
            </select>
          </label>
          <label>
            メモ / 品名
            <input type="text" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} required />
          </label>
          <label>
            金額 ($)
            <input type="number" step="10" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} required />
          </label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
            <button type="submit" className="action-button primary" style={{ flex: 1 }}>追加する</button>
            <button type="button" className="action-button secondary" onClick={onClose}>キャンセル</button>
          </div>
        </form>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('app/components/modals/ExpenseModal.tsx', modalCode);
console.log('Successfully rewrote ExpenseModal.tsx');
