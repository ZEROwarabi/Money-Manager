const fs = require('fs');

const modalCode = `import React, { useState } from 'react';
import { formatCurrency } from '../../lib/format';
import { AppData } from '../../types';

interface TripReconcileModalProps {
  onClose: () => void;
  fetchData: () => void;
  summary: AppData['summary'] | undefined;
}

export const TripReconcileModal: React.FC<TripReconcileModalProps> = ({
  onClose,
  fetchData,
  summary
}) => {
  const [reconcileForm, setReconcileForm] = useState({ myShare: '', recovered: '' });

  const handleReconcileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcileForm.myShare || !reconcileForm.recovered) return;
    try {
      const today = new Date();
      const payload = {
        date: today.toISOString().split('T')[0].replace(/-/g, '/'),
        myShare: reconcileForm.myShare,
        recovered: reconcileForm.recovered
      };
      await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trip_reconcile', payload })
      });
      alert('旅行プールの一括精算が完了しました！');
      onClose();
      fetchData();
    } catch (err) {
      alert('エラーが発生しました');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="chart-title" style={{ color: '#d97706' }}>🎒 ワンクリック一括精算</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          隔離保留中だった総額（{formatCurrency(summary?.unsettledTripSandbox || 0)}）を一括精算します。<br/>
          自分の実費分は「特別体験・イベント費」として記録され、残りは回収分として総残高を復元します。
        </p>
        <form onSubmit={handleReconcileSubmit} className="form-container">
          <label>
            最終的な自分の実費総額 ($)
            <input type="number" step="0.01" value={reconcileForm.myShare} onChange={e => setReconcileForm({...reconcileForm, myShare: e.target.value})} required placeholder="例: 150.00" />
          </label>
          <label>
            友人からの回収・立替精算額 ($)
            <input type="number" step="0.01" value={reconcileForm.recovered} onChange={e => setReconcileForm({...reconcileForm, recovered: e.target.value})} required placeholder="例: 350.00" />
          </label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
            <button type="submit" className="action-button primary" style={{ flex: 1, background: '#f59e0b', border: 'none' }}>精算を完了する</button>
            <button type="button" className="action-button secondary" onClick={onClose}>キャンセル</button>
          </div>
        </form>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('app/components/modals/TripReconcileModal.tsx', modalCode);

let pageCode = fs.readFileSync('app/page.tsx', 'utf8');
const lines = pageCode.split('\n');

// Remove state
const stateIdx = lines.findIndex(l => l.includes('const [reconcileForm, setReconcileForm] = useState'));
if (stateIdx !== -1) lines.splice(stateIdx, 1);

// Remove handleReconcileSubmit
const handleStart = lines.findIndex(l => l.includes('const handleReconcileSubmit = async'));
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

// Replace JSX
const jsxStart = lines.findIndex(l => l.includes('{showReconcileModal && ('));
if (jsxStart !== -1) {
  let jsxEnd = -1;
  let openBrackets = 0;
  for (let i = jsxStart; i < lines.length; i++) {
    if (lines[i].includes('(')) openBrackets += (lines[i].match(/\(/g) || []).length;
    if (lines[i].includes(')')) openBrackets -= (lines[i].match(/\)/g) || []).length;
    if (openBrackets === 0) {
      jsxEnd = i;
      break;
    }
  }
  if (jsxEnd !== -1) {
    const newComponent = `      {showReconcileModal && (
        <TripReconcileModal
          onClose={() => setShowReconcileModal(false)}
          fetchData={fetchData}
          summary={summary}
        />
      )}`;
    lines.splice(jsxStart, jsxEnd - jsxStart + 1, newComponent);
  }
}

let modifiedCode = lines.join('\n');
const importStmt = "import { TripReconcileModal } from './components/modals/TripReconcileModal';\n";
modifiedCode = modifiedCode.replace(/import \{ OffsetModal /, importStmt + "import { OffsetModal ");

fs.writeFileSync('app/page.tsx', modifiedCode);
console.log('Successfully updated page.tsx with TripReconcileModal');
