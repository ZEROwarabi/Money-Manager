import React, { useState, useEffect } from 'react';
import { useFinanceContext } from '../../context/FinanceContext';

interface RawJsonEditorModalProps {
  onClose: () => void;
}

export const RawJsonEditorModal: React.FC<RawJsonEditorModalProps> = ({
  onClose}) => {
  const { data, fetchData } = useFinanceContext();
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
        (typeof window !== "undefined" && (window as any).showAlert || window.alert)('データの取得に失敗しました。');
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
        (typeof window !== "undefined" && (window as any).showAlert || window.alert)('データを保存しました。');
        onClose();
        fetchData();
      } else {
        (typeof window !== "undefined" && (window as any).showAlert || window.alert)(result.error || '保存に失敗しました。');
      }
    } catch (err) {
      (typeof window !== "undefined" && (window as any).showAlert || window.alert)('JSONの形式が正しくありません。');
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
