"use client";

import React, { useState } from 'react';
import { Transaction } from '../types';
import { FinanceDataContext } from '../context/FinanceContext';
import { CsvReconcileModal } from '../components/modals/CsvReconcileModal';

// ダミーのアプリデータ（データベースに入っていると仮定するデータ）
const MOCK_APP_RECORDS: Transaction[] = [
  { id: '1', date: '2026/08/01', category: '食費', description: 'スーパー', expense: 1500, income: 0, balance: 0, month: '2026-08', recordType: 'expense_normal', reconciled: false },
  { id: '2', date: '2026/08/02', category: '交通費', description: '電車', expense: 480, income: 0, balance: 0, month: '2026-08', recordType: 'expense_normal', reconciled: false },
  { id: '3', date: '2026/08/05', category: '交際費', description: '飲み会', expense: 5000, income: 0, balance: 0, month: '2026-08', recordType: 'expense_normal', reconciled: false },
  { id: '4', date: '2026/08/06', category: '給料', description: '給料', expense: 0, income: 250000, balance: 0, month: '2026-08', recordType: 'income_normal', reconciled: false },
];

// ダミーのCSVデータ（銀行からダウンロードしたと仮定するデータ）
const MOCK_CSV_RECORDS: Transaction[] = [
  { id: 'c1', date: '2026/08/01', category: '', description: 'ｲｵﾝ', expense: 1500, income: 0, balance: 0, month: '2026-08', recordType: 'expense_normal', reconciled: false },
  { id: 'c2', date: '2026/08/02', category: '', description: 'JRﾋｶﾞｼﾆﾎﾝ', expense: 480, income: 0, balance: 0, month: '2026-08', recordType: 'expense_normal', reconciled: false },
  { id: 'c3', date: '2026/08/05', category: '', description: 'ﾜﾀﾐ', expense: 5000, income: 0, balance: 0, month: '2026-08', recordType: 'expense_normal', reconciled: false },
  { id: 'c4', date: '2026/08/06', category: '', description: 'ｷﾕｳﾖ', expense: 0, income: 250000, balance: 0, month: '2026-08', recordType: 'income_normal', reconciled: false },
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
      <h1 style={{ color: 'white' }}>🧪 安全なローカル検証用サンドボックス</h1>
      <p style={{ color: 'white' }}>このページはダミーデータを使用しており、実際のデータベースには一切影響を与えません。</p>
      <p style={{ color: 'white' }}>「照合確定」を押してもデータは保存されないため、何度でも線の動きや履歴機能をテストできます。</p>
      
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
