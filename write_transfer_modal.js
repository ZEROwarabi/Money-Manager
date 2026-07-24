const fs = require('fs');

const modalCode = `import React, { useState } from 'react';
import { CategoryBudget } from '../../types';
import { formatCurrency } from '../../lib/format';

interface TransferModalProps {
  onClose: () => void;
  fetchData: () => void;
  currentRealMonth: string;
  variableCategories: CategoryBudget[];
  uniqueCategories: string[];
}

export const TransferModal: React.FC<TransferModalProps> = ({
  onClose,
  fetchData,
  currentRealMonth,
  variableCategories,
  uniqueCategories
}) => {
  const [transferForm, setTransferForm] = useState({ fromCategory: '', toCategory: '', amount: '' });

  const handleTransferBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.fromCategory || !transferForm.toCategory || !transferForm.amount) return;
    if (transferForm.fromCategory === transferForm.toCategory) {
      alert("同じカテゴリ間では移動できません。");
      return;
    }

    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'transfer_budget', 
          payload: { 
            month: currentRealMonth,
            fromCategory: transferForm.fromCategory,
            toCategory: transferForm.toCategory,
            amount: transferForm.amount
          }
        })
      });
      if (res.ok) {
        onClose();
        fetchData();
      } else {
        const errorData = await res.json();
        alert(\`エラー: \${errorData.error}\`);
      }
    } catch (err) {
      alert("エラーが発生しました");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="chart-title">🚚 予算のお引越し (今月分のみ)</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          「食費を減らして、娯楽費に回す」など、今月だけの柔軟なやりくりができます。全体の予算合計額は変わりません。
        </p>
        <form onSubmit={handleTransferBudget} className="form-container">
          <label>
            どこから？ (減らすカテゴリ)
            <select value={transferForm.fromCategory} onChange={e => setTransferForm({...transferForm, fromCategory: e.target.value})} required>
              <option value="">選択してください</option>
              {variableCategories.filter((c: CategoryBudget) => (c.remaining || 0) > 0).map((c: CategoryBudget) => (
                 <option key={c.name} value={c.name}>{c.name} (残り: {formatCurrency(c.remaining || 0)})</option>
              ))}
            </select>
          </label>
          
          <label>
            どこへ？ (増やすカテゴリ)
            <select value={transferForm.toCategory} onChange={e => setTransferForm({...transferForm, toCategory: e.target.value})} required>
              <option value="">選択してください</option>
              {uniqueCategories.map((cat: string) => (
                 <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>

          {transferForm.fromCategory === '環境・自己投資' || transferForm.fromCategory === '衣服代' ? (
            <div style={{ background: '#fef2f2', border: '1px solid #ef4444', color: '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
              <strong>🛑 【絶対禁止】聖域カテゴリーからの移行</strong><br/>
              「{transferForm.fromCategory}」からの予算移動は戦略上禁止されています。自己投資や良質なウェアのための資金を守ってください！
            </div>
          ) : null}

          {transferForm.toCategory === 'ガソリン交通費' && transferForm.fromCategory !== '食費' && transferForm.fromCategory !== '娯楽・リフレッシュ費' ? (
            <div style={{ background: '#f0fdf4', border: '1px solid #22c55e', color: '#15803d', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
              <strong>💡 交通費オーバー時の推奨アクション</strong><br/>
              交通費の補填元は<strong>「食費」を第1優先、「娯楽・リフレッシュ費」を第2優先</strong>にしてください。チープドーパミン消費を削り出した余白でカバーするのが最も期待値が高いです！
            </div>
          ) : null}

          <label>
            いくら移動する？ ($)
            <input 
              type="number" 
              step="1" 
              min="1"
              value={transferForm.amount} 
              onChange={e => setTransferForm({...transferForm, amount: e.target.value})} 
              required 
            />
          </label>

          <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
            <button 
              type="submit" 
              className="action-button primary" 
              style={{ flex: 1, opacity: (transferForm.fromCategory === '環境・自己投資' || transferForm.fromCategory === '衣服代') ? 0.5 : 1 }}
              disabled={transferForm.fromCategory === '環境・自己投資' || transferForm.fromCategory === '衣服代'}
            >
              移動する！
            </button>
            <button type="button" className="action-button secondary" onClick={onClose}>キャンセル</button>
          </div>
        </form>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('app/components/modals/TransferModal.tsx', modalCode);

// Update page.tsx
let pageCode = fs.readFileSync('app/page.tsx', 'utf8');

// Remove state
pageCode = pageCode.replace(/const \[transferForm, setTransferForm\] = useState\(\{ fromCategory: '', toCategory: '', amount: '' \}\);\n?/g, '');

// Remove handleTransferBudget
const handleStart = pageCode.indexOf('const handleTransferBudget = async');
if (handleStart !== -1) {
  let openBrackets = 0;
  let handleEnd = -1;
  for (let i = handleStart; i < pageCode.length; i++) {
    if (pageCode[i] === '{') openBrackets++;
    if (pageCode[i] === '}') {
      openBrackets--;
      if (openBrackets === 0) {
        handleEnd = i;
        break;
      }
    }
  }
  pageCode = pageCode.substring(0, handleStart) + pageCode.substring(handleEnd + 1);
}

// Replace JSX
const jsxStart = pageCode.indexOf('{/* Transfer Budget Modal */}');
if (jsxStart !== -1) {
  let jsxEnd = -1;
  let openBrackets = 0;
  // find first '{' which is {showTransferModal && (
  for (let i = jsxStart; i < pageCode.length; i++) {
    if (pageCode[i] === '{') {
       openBrackets++;
    } else if (pageCode[i] === '}') {
       openBrackets--;
       if (openBrackets === 0) {
         jsxEnd = i;
         break;
       }
    }
  }
  
  // wait, {showTransferModal && (...)} means the closing is }
  // but JSX tags might have { and }. 
  // Let's do it by lines instead of character by character to be safe.
}

