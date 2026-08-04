import React, { useState } from 'react';
import { Transaction, AppData, RecordType } from '../../types';
import { formatCurrency } from '../../lib/format';
import { autoReconcile } from '../../lib/reconcile';
import { useFinanceContext } from '../../context/FinanceContext';

interface CsvReconcileModalProps {
  onClose: () => void;
  csvRecords: Transaction[];
  setCsvRecords: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

export const CsvReconcileModal: React.FC<CsvReconcileModalProps> = ({ onClose, csvRecords, setCsvRecords }) => {
  const { data, fetchData } = useFinanceContext();
  const [bankBalanceInput, setBankBalanceInput] = useState<string>('');
  const [selectedCsvIndices, setSelectedCsvIndices] = useState<Set<number>>(new Set());
  const [selectedAppIndices, setSelectedAppIndices] = useState<Set<number>>(new Set());

  const autoReconcileBtn = () => {
    const res = autoReconcile(csvRecords, data?.records || []);
    setSelectedCsvIndices(res.matchedBankIndices);
    setSelectedAppIndices(res.matchedAppIndices);
  };

  const parsedBank = parseFloat(String(bankBalanceInput));
  const calculatedBankBalance = (isNaN(parsedBank) ? 0 : parsedBank) + Array.from(selectedCsvIndices).reduce((sum, idx) => sum + ((csvRecords[idx]?.expense || 0) - (csvRecords[idx]?.income || 0)), 0);

  const unreconciled = (data?.records || []).filter((r: Transaction) => !r.reconciled && (r.expense > 0 || r.income > 0));

  const handleReconcile = async (isAdjustment = false) => {
    // Both sides empty = everything is reconciled
    if (csvRecords.length === 0 && unreconciled.length === 0) {
      (typeof window !== "undefined" && (window as any).showAlert || window.alert)('✨ すべてのデータが照合済みです！');
      onClose();
      return;
    }
    if (selectedCsvIndices.size === 0 && selectedAppIndices.size === 0) {
      (typeof window !== "undefined" && (window as any).showAlert || window.alert)('照合するデータにチェックを入れてください');
      return;
    }
    
    const csvTotal = Array.from(selectedCsvIndices).reduce((sum, idx) => sum + ((csvRecords[idx]?.expense || 0) - (csvRecords[idx]?.income || 0)), 0);
    const appTotal = Array.from(selectedAppIndices).reduce((sum, idx) => {
      const r = (data?.records || [])[idx];
      return sum + ((r?.expense || 0) - (r?.income || 0));
    }, 0);
    const diff = Math.round((csvTotal - appTotal) * 100) / 100;
    
    let newRecords: Transaction[] = [];
    if (!isAdjustment && selectedCsvIndices.size > 0 && selectedAppIndices.size === 0) {
       newRecords = Array.from(selectedCsvIndices).map(idx => {
          const r = csvRecords[idx];
          return {
            ...r,
            month: r.month || r.date.substring(0, 7).replace('/', '-'),
            recordType: 'expense_normal',
            reconciled: true
          };
       });
    } else if (isAdjustment && diff !== 0) {
       const cat = window.prompt("差額分のカテゴリ名を入力してください (例: その他, 手数料, 照合調整金)", "その他");
       if (!cat) return;
       const today = new Date();
       const todayStr = today.toISOString().split('T')[0].replace(/-/g, '/');
       const isExp = diff > 0;
       newRecords.push({
         date: todayStr,
         category: cat,
         description: 'CSV照合調整',
         expense: isExp ? diff : 0,
         income: isExp ? 0 : -diff,
         balance: 0,
         month: todayStr.substring(0, 7).replace('/', '-'),
         recordType: 'expense_normal' as RecordType,
         reconciled: true});
    }

    const updates = Array.from(selectedAppIndices).map(idx => {
       const r = (data?.records || [])[idx];
       return { ...r, reconciled: true };
    });
    
    const allUpdates = [...updates, ...newRecords];
    
    if (allUpdates.length === 0) {
       (typeof window !== "undefined" && (window as any).showAlert || window.alert)('照合するデータが選択されていません');
       return;
    }
    
    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'batch_update', records: allUpdates })
      });
      if (res.ok) {
         fetchData();
         const remainingCsv = csvRecords.filter((_, idx) => !selectedCsvIndices.has(idx));
         setCsvRecords(remainingCsv);
         setSelectedCsvIndices(new Set());
         setSelectedAppIndices(new Set());
         if (remainingCsv.length === 0) {
            (typeof window !== "undefined" && (window as any).showAlert || window.alert)('すべてのCSVデータが照合されました！');
            onClose();
         }
      } else {
         (typeof window !== "undefined" && (window as any).showAlert || window.alert)('更新に失敗しました');
      }
    } catch (err) {
      (typeof window !== "undefined" && (window as any).showAlert || window.alert)('エラーが発生しました');
    }
  };

  const csvTotal = Array.from(selectedCsvIndices).reduce((sum, idx) => sum + ((csvRecords[idx]?.expense || 0) - (csvRecords[idx]?.income || 0)), 0);
  const appTotal = Array.from(selectedAppIndices).reduce((sum, idx) => {
    const r = (data?.records || [])[idx];
    return sum + ((r?.expense || 0) - (r?.income || 0));
  }, 0);
  const diff = Math.round((csvTotal - appTotal) * 100) / 100;
  const isMatch = Math.abs(diff) < 0.01;

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ width: '95%', maxWidth: '1200px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>CSV 比較照合エンジン</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', padding: '5px 15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>🏦 銀行残高確認:</span>
              <input 
                type="number" 
                value={bankBalanceInput} 
                onChange={e => setBankBalanceInput(e.target.value)}
                placeholder="現在の銀行残高を入力"
                className="modal-input"
                style={{ width: '200px', margin: 0 }}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                → 取引後: <span style={{ color: calculatedBankBalance < 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{formatCurrency(calculatedBankBalance)}</span>
              </span>
            </div>
            <button className="action-button secondary" onClick={autoReconcileBtn}>🤖 AI 自動照合 (Beta)</button>
          </div>
          <button className="action-button" onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>✕ 閉じる</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flex: 1, minHeight: 0 }}>
          <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ margin: 0, display: 'flex', justifyContent: 'space-between' }}>
                <span>📄 未照合のCSVデータ ({csvRecords.length}件)</span>
                <span style={{ color: 'var(--accent-color)' }}>選択合計: {formatCurrency(csvTotal)}</span>
              </h3>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>選択</th><th>日付</th><th>摘要</th><th>出金</th><th>入金</th>
                  </tr>
                </thead>
                <tbody>
                  {csvRecords.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center' }}>データがありません</td></tr>}
                  {csvRecords.map((r, i) => {
                    const isSelected = selectedCsvIndices.has(i);
                    return (
                      <tr key={i} onClick={() => {
                        const newSet = new Set(selectedCsvIndices);
                        if (isSelected) newSet.delete(i);
                        else newSet.add(i);
                        setSelectedCsvIndices(newSet);
                      }} style={{ cursor: 'pointer', background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent' }}>
                        <td><input type="checkbox" checked={isSelected} readOnly /></td>
                        <td>{r.date}</td>
                        <td style={{ fontSize: '0.85rem' }}>{r.description}</td>
                        <td className="expense">{r.expense > 0 ? formatCurrency(r.expense) : ''}</td>
                        <td className="income">{r.income > 0 ? formatCurrency(r.income) : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ margin: 0, display: 'flex', justifyContent: 'space-between' }}>
                <span>📱 未照合のアプリデータ</span>
                <span style={{ color: 'var(--accent-color)' }}>選択合計: {formatCurrency(appTotal)}</span>
              </h3>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>選択</th><th>日付</th><th>カテゴリ</th><th>金額</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.records || [])
                    .map((r: Transaction, i: number) => ({ ...r, originalIndex: i }))
                    .filter((r: Transaction) => !r.reconciled && (r.expense > 0 || r.income > 0))
                    .map((r: Transaction) => {
                      const isSelected = selectedAppIndices.has(r.originalIndex ?? -1);
                      const isIncome = r.income > 0;
                      const amount = isIncome ? r.income : r.expense;
                      return (
                        <tr key={r.originalIndex} onClick={() => {
                          const newSet = new Set(selectedAppIndices);
                          if (isSelected) newSet.delete(r.originalIndex ?? -1);
                          else newSet.add(r.originalIndex ?? -1);
                          setSelectedAppIndices(newSet);
                        }} style={{ cursor: 'pointer', background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent' }}>
                          <td><input type="checkbox" checked={isSelected} readOnly /></td>
                          <td>{r.date}</td>
                          <td>{r.category}</td>
                          <td className={isIncome ? 'income' : 'expense'}>{formatCurrency(amount)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px', padding: '20px', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>
              差額: <span style={{ color: Math.abs(diff) < 0.01 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{formatCurrency(diff)}</span>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {Math.abs(diff) < 0.01 ? '✨ 一致しています。照合可能です。' : '⚠️ 金額が一致しません。差額調整して照合するか、選択を見直してください。'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
             {isMatch ? (
               <button className="action-button primary" onClick={() => handleReconcile(false)}>✅ 照合確定</button>
             ) : (
               <>
                 <button className="action-button" style={{ background: '#3b82f6', border: 'none', color: '#fff' }} onClick={() => handleReconcile(false)}>📥 CSVから新規登録</button>
                 <button className="action-button secondary" onClick={() => handleReconcile(true)}>⚖️ 差額を自動作成して照合</button>
               </>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
