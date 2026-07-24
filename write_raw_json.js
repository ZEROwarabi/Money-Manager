const fs = require('fs');

const modalCode = `import React, { useState, useEffect } from 'react';

interface RawJsonEditorModalProps {
  onClose: () => void;
  fetchData: () => void;
}

export const RawJsonEditorModal: React.FC<RawJsonEditorModalProps> = ({
  onClose,
  fetchData,
}) => {
  const [rawJsonText, setRawJsonText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDb = async () => {
      try {
        const res = await fetch('/api/finance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'export_db' })
        });
        const data = await res.json();
        if (data.success && data.db) {
          setRawJsonText(JSON.stringify(data.db, null, 2));
        }
      } catch (err) {
        alert('データの取得に失敗しました。');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDb();
  }, []);

  const saveRawEditor = async () => {
    try {
      const dbData = JSON.parse(rawJsonText);
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import_db', payload: dbData })
      });
      const result = await res.json();
      if (result.success) {
        alert('データを保存しました。');
        onClose();
        fetchData();
      } else {
        alert(result.error || '保存に失敗しました。');
      }
    } catch (err) {
      alert('JSONの形式が正しくありません。');
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <h2 className="chart-title">データを直接編集 (JSON)</h2>
        <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>※JSONの構造を壊さないよう十分ご注意ください。</p>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <textarea 
            value={rawJsonText} 
            onChange={e => setRawJsonText(e.target.value)}
            style={{ width: '100%', height: '500px', padding: '1rem', fontFamily: 'monospace', fontSize: '0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '1rem' }}
          />
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="action-button primary" onClick={saveRawEditor} style={{ flex: 1 }} disabled={isLoading}>保存して反映する</button>
          <button type="button" className="action-button secondary" onClick={onClose}>キャンセル</button>
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('app/components/modals/RawJsonEditorModal.tsx', modalCode);

// Update page.tsx
let pageCode = fs.readFileSync('app/page.tsx', 'utf8');

pageCode = pageCode.replace(/onClick=\{openRawEditor\}/g, 'onClick={() => setShowRawEditor(true)}');

const lines = pageCode.split('\n');

// 1. Remove state
const stateIdx = lines.findIndex(l => l.includes('const [rawJsonText, setRawJsonText] = useState'));
if (stateIdx !== -1) {
  lines.splice(stateIdx, 1);
}

// 2. Remove openRawEditor
const openStart = lines.findIndex(l => l.includes('const openRawEditor = async'));
if (openStart !== -1) {
  let openBrackets = 0;
  let handleEnd = -1;
  for (let i = openStart; i < lines.length; i++) {
    if (lines[i].includes('{')) openBrackets += (lines[i].match(/\{/g) || []).length;
    if (lines[i].includes('}')) openBrackets -= (lines[i].match(/\}/g) || []).length;
    if (openBrackets === 0) {
      handleEnd = i;
      break;
    }
  }
  if (handleEnd !== -1) {
    lines.splice(openStart, handleEnd - openStart + 1);
  }
}

// 3. Remove saveRawEditor
const saveStart = lines.findIndex(l => l.includes('const saveRawEditor = async'));
if (saveStart !== -1) {
  let openBrackets = 0;
  let handleEnd = -1;
  for (let i = saveStart; i < lines.length; i++) {
    if (lines[i].includes('{')) openBrackets += (lines[i].match(/\{/g) || []).length;
    if (lines[i].includes('}')) openBrackets -= (lines[i].match(/\}/g) || []).length;
    if (openBrackets === 0) {
      handleEnd = i;
      break;
    }
  }
  if (handleEnd !== -1) {
    lines.splice(saveStart, handleEnd - saveStart + 1);
  }
}

// 4. Replace JSX
const jsxStart = lines.findIndex(l => l.includes('{showRawEditor && ('));
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
    const newComponent = `      {showRawEditor && (
        <RawJsonEditorModal
          onClose={() => setShowRawEditor(false)}
          fetchData={fetchData}
        />
      )}`;
    lines.splice(jsxStart, jsxEnd - jsxStart + 1, newComponent);
  }
}

let modifiedCode = lines.join('\n');
const importStmt = "import { RawJsonEditorModal } from './components/modals/RawJsonEditorModal';\n";
modifiedCode = modifiedCode.replace(/import \{ TransferModal /, importStmt + "import { TransferModal ");

fs.writeFileSync('app/page.tsx', modifiedCode);
console.log('Successfully updated page.tsx with RawJsonEditorModal');
