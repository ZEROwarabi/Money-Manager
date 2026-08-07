"use client";

import React, { useState } from 'react';
import { Transaction } from '../types';
import { FinanceDataContext } from '../context/FinanceContext';
import { CsvReconcileModal } from '../components/modals/CsvReconcileModal';

// ========================================
// ダミーのアプリデータ（データベースに入っていると仮定するデータ）
// ========================================
const MOCK_APP_RECORDS: Transaction[] = [
  // --- 1対2テスト用: アプリ側は個別記録 ($1,500 + $480 = $1,980) ---
  { id: '1', date: '2026/08/01', category: '食費', description: 'スーパーで買い物', expense: 1500, income: 0, balance: 0, month: '2026-08', recordType: 'expense_normal', reconciled: false },
  { id: '2', date: '2026/08/01', category: '交通費', description: '電車代', expense: 480, income: 0, balance: 0, month: '2026-08', recordType: 'expense_normal', reconciled: false },
  // --- 1対1テスト用 ---
  { id: '3', date: '2026/08/03', category: '食費', description: 'コンビニ', expense: 350, income: 0, balance: 0, month: '2026-08', recordType: 'expense_normal', reconciled: false },
  { id: '4', date: '2026/08/04', category: '生活用品', description: 'ドラッグストア', expense: 1200, income: 0, balance: 0, month: '2026-08', recordType: 'expense_normal', reconciled: false },
  // --- 2対1テスト用: アプリ側は合算記録 ($3,000 + $5,000 = $8,000) ---
  { id: '5', date: '2026/08/05', category: '交際費', description: '飲み会まとめ', expense: 8000, income: 0, balance: 0, month: '2026-08', recordType: 'expense_normal', reconciled: false },
  // --- 1対1テスト用 ---
  { id: '6', date: '2026/08/06', category: '給料', description: '給料', expense: 0, income: 250000, balance: 0, month: '2026-08', recordType: 'income_normal', reconciled: false },
];

// ========================================
// ダミーのCSVデータ（銀行からダウンロードしたと仮定するデータ）
// ========================================
const MOCK_CSV_RECORDS: Transaction[] = [
  // --- 1対2テスト用: 銀行側は合算引き落とし ($1,980 = 食費$1,500 + 交通費$480) ---
  { id: 'c1', date: '2026/08/01', category: '', description: 'ｲｵﾝ ｶｰﾄﾞ ｲｯｶﾂ', expense: 1980, income: 0, balance: 0, month: '2026-08', recordType: 'expense_normal', reconciled: false },
  // --- 1対1テスト用 ---
  { id: 'c2', date: '2026/08/03', category: '', description: 'ｾﾌﾞﾝｲﾚﾌﾞﾝ', expense: 350, income: 0, balance: 0, month: '2026-08', recordType: 'expense_normal', reconciled: false },
  { id: 'c3', date: '2026/08/04', category: '', description: 'ﾏﾂﾓﾄｷﾖｼ', expense: 1200, income: 0, balance: 0, month: '2026-08', recordType: 'expense_normal', reconciled: false },
  // --- 2対1テスト用: 銀行側は個別明細 ($3,000 + $5,000 = 交際費$8,000) ---
  { id: 'c4', date: '2026/08/05', category: '', description: 'ﾜﾀﾐ ｼﾝｼﾞｭｸ', expense: 3000, income: 0, balance: 0, month: '2026-08', recordType: 'expense_normal', reconciled: false },
  { id: 'c5', date: '2026/08/05', category: '', description: 'ｶﾗｵｹ ﾏﾈｷﾈｺ', expense: 5000, income: 0, balance: 0, month: '2026-08', recordType: 'expense_normal', reconciled: false },
  // --- 1対1テスト用 ---
  { id: 'c6', date: '2026/08/06', category: '', description: 'ｷﾕｳﾖ ﾌﾘｺﾐ', expense: 0, income: 250000, balance: 0, month: '2026-08', recordType: 'income_normal', reconciled: false },
];

// Contextのフック自体を上書きするコンポーネントラッパー
const SandboxApp = () => {
  const [csvRecords, setCsvRecords] = useState<Transaction[]>(MOCK_CSV_RECORDS);
  const [appRecords, setAppRecords] = useState<Transaction[]>(MOCK_APP_RECORDS);
  const [showModal, setShowModal] = useState(true);

  // fetch をモック化して、実際のDBに書き込まれないようにする
  React.useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [resource, config] = args;
      if (typeof resource === 'string' && resource.includes('/api/finance')) {
        console.log('Mocked API Call:', config);
        
        if (config?.body) {
           const body = JSON.parse(config.body as string);
           if (body.action === 'batch_update') {
              const updatedIds = body.records.map((r: any) => r.id || r.originalIndex);
              setAppRecords(prev => prev.map(r => updatedIds.includes(r.id) ? { ...r, reconciled: true } : r));
           }
        }
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return originalFetch(...args);
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <div style={{ padding: '20px', background: '#0f172a', minHeight: '100vh', color: 'var(--text-primary)' }}>
      <h1 style={{ color: 'white' }}>🧪 照合テスト用サンドボックス</h1>
      <div style={{ color: '#94a3b8', marginBottom: '20px', fontSize: '0.9rem', lineHeight: 1.7 }}>
        <p style={{ margin: '0 0 8px 0' }}>📌 <strong style={{ color: '#38bdf8' }}>1対2テスト:</strong> CSV「ｲｵﾝ ｶｰﾄﾞ ｲｯｶﾂ ($1,980)」 ↔ アプリ「食費 ($1,500)」+「交通費 ($480)」</p>
        <p style={{ margin: '0 0 8px 0' }}>📌 <strong style={{ color: '#fb923c' }}>2対1テスト:</strong> CSV「ﾜﾀﾐ ($3,000)」+「ｶﾗｵｹ ($5,000)」 ↔ アプリ「交際費 ($8,000)」</p>
        <p style={{ margin: '0 0 8px 0' }}>📌 <strong style={{ color: '#a3e635' }}>1対1テスト:</strong> ｾﾌﾞﾝ ($350)、ﾏﾂﾓﾄｷﾖｼ ($1,200)、ｷﾕｳﾖ ($250,000)</p>
        <p style={{ margin: 0, color: '#64748b' }}>※ このページのデータは実際のDBに影響しません。何度でもリセットしてお試しください。</p>
      </div>
      
      <button 
        onClick={() => {
          setCsvRecords(MOCK_CSV_RECORDS);
          setAppRecords(MOCK_APP_RECORDS);
          setShowModal(true);
        }}
        style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px' }}
      >
        🔄 データをリセットしてモーダルを開く
      </button>

      <div style={{ position: 'relative', height: '80vh', border: '2px dashed #475569', borderRadius: '12px', overflow: 'hidden' }}>
        <FinanceDataContext.Provider value={{
           data: { records: appRecords, monthlySettings: {}, accounts: [], categoryBudgets: {}, wishlist: [], ignoredBudgetCategories: [] },
           loading: false,
           fetchData: () => {},
           addRecord: async () => {},
           updateRecord: async () => {},
           deleteRecord: async () => {},
           toggleReconciled: async () => {},
           toggleIgnoredCategory: async () => {},
        } as any}>
          {showModal ? (
            <CsvReconcileModal 
              onClose={() => setShowModal(false)} 
              csvRecords={csvRecords} 
              setCsvRecords={setCsvRecords} 
            />
          ) : (
            <div style={{ padding: '40px', color: 'white', textAlign: 'center' }}>
              <h2>モーダルは閉じられました</h2>
              <p>実際のアプリでは、ここで元のダッシュボード画面に戻ります。</p>
              <p>再度テストする場合は上のリセットボタンを押してください。</p>
            </div>
          )}
        </FinanceDataContext.Provider>
      </div>
    </div>
  );
};

export default function SandboxPage() {
  return <SandboxApp />;
}
