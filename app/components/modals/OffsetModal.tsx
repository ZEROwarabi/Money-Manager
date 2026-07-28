import React, { useState } from 'react';
import { useFinanceContext } from '../../context/FinanceContext';

interface OffsetModalProps {
  onClose: () => void;
  uniqueCategories: string[];
}

export const OffsetModal: React.FC<OffsetModalProps> = ({
  onClose,
  uniqueCategories
}) => {
  const { data, fetchData } = useFinanceContext();
  const [offsetForm, setOffsetForm] = useState({ amount: '', category: '' });

  const handleOffsetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offsetForm.amount || !offsetForm.category) return;
    try {
      const today = new Date();
      const payload = {
        date: today.toISOString().split('T')[0].replace(/-/g, '/'),
        category: offsetForm.category,
        description: `一括相殺（${offsetForm.category}）`,
        amount: offsetForm.amount,
        recordType: 'refund'
      };
      await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_expense', payload })
      });
      (typeof window !== "undefined" && (window as any).showAlert || window.alert)(`+$${offsetForm.amount} が ${offsetForm.category} の予算に復活しました！`);
      onClose();
      fetchData();
    } catch (err) {
      (typeof window !== "undefined" && (window as any).showAlert || window.alert)('エラーが発生しました');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="chart-title">🤝 割り勘カンタン一括回収 (相殺)</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          友人から受け取った割り勘分を、指定したカテゴリの当月支出からマイナスして相殺（復活）させます。
        </p>
        <form onSubmit={handleOffsetSubmit} className="form-container">
          <label>
            相殺するカテゴリ
            <select value={offsetForm.category} onChange={e => setOffsetForm({...offsetForm, category: e.target.value})} required>
              <option value="">選択してください</option>
              {uniqueCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>
            回収した金額 ($)
            <input type="number" step="0.01" value={offsetForm.amount} onChange={e => setOffsetForm({...offsetForm, amount: e.target.value})} required placeholder="例: 31.25" />
          </label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
            <button type="submit" className="action-button primary" style={{ flex: 1, background: '#10b981', border: 'none' }}>相殺して予算を復活させる</button>
            <button type="button" className="action-button secondary" onClick={onClose}>キャンセル</button>
          </div>
        </form>
      </div>
    </div>
  );
};
