'use client';
import React, { useState } from 'react';

export default function TestGeminiPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [modelName, setModelName] = useState('gemini-2.0-flash');

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelName }),
      });
      const data = await res.json();
      setResult({ status: res.status, data });
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Gemini API 動作テストツール</h1>
      <p style={{ marginBottom: '1rem', color: '#666' }}>
        現在 `.env.local` に設定されている `GEMINI_API_KEY` を使って、実際にGoogleのサーバーと通信テストを行います。
      </p>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '1rem' }}>
          モデル選択: 
          <select value={modelName} onChange={e => setModelName(e.target.value)} style={{ marginLeft: '0.5rem', padding: '0.3rem' }}>
            <option value="gemini-2.0-flash">gemini-2.0-flash</option>
            <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite</option>
            <option value="gemini-1.5-flash">gemini-1.5-flash</option>
          </select>
        </label>
      </div>

      <button 
        onClick={handleTest} 
        disabled={loading}
        style={{
          padding: '0.8rem 1.5rem',
          background: loading ? '#ccc' : '#0369a1',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '通信中...' : 'APIテストを実行する'}
      </button>

      {result && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>テスト結果:</h2>
          
          {result.status === 200 && result.data.success ? (
            <div style={{ background: '#dcfce7', padding: '1rem', borderRadius: '8px', color: '#166534' }}>
              <strong>✅ 通信成功！</strong>
              <p style={{ marginTop: '0.5rem' }}>AIの返答: {result.data.text}</p>
            </div>
          ) : (
            <div style={{ background: '#fee2e2', padding: '1rem', borderRadius: '8px', color: '#991b1b', wordBreak: 'break-all' }}>
              <strong>❌ 通信失敗 (HTTP {result.status})</strong>
              <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                {JSON.stringify(result.data || result.error, null, 2)}
              </pre>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                ※ <code>Quota exceeded</code> や <code>limit: 0</code> が出ている場合、APIキーがGoogleによって制限されています。Google AI Studioで利用枠を確認してください。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
