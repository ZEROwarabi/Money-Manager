'use client';
import React, { useState } from 'react';

export default function TestGeminiPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [modelName, setModelName] = useState('local-gemma2');

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      if (modelName === 'local-gemma2') {
        const res = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemma2',
            prompt: 'こんにちは！テストメッセージです。',
            stream: false
          })
        });
        if (!res.ok) throw new Error(`Ollama HTTP Error: ${res.status}`);
        const data = await res.json();
        setResult({ status: 200, data: { success: true, text: data.response }});
      } else {
        const res = await fetch('/api/test-gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modelName }),
        });
        const data = await res.json();
        setResult({ status: res.status, data });
      }
    } catch (e: any) {
      setResult({ status: 500, data: { success: false }, error: e.message });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>AI API 動作テストツール</h1>
      <p style={{ marginBottom: '1rem', color: '#666' }}>
        Gemini（クラウド）または Ollama（ローカル）との通信テストを行います。
      </p>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '1rem' }}>
          モデル選択: 
          <select value={modelName} onChange={e => setModelName(e.target.value)} style={{ marginLeft: '0.5rem', padding: '0.3rem' }}>
            <option value="local-gemma2">Ollama: Gemma 2 (Local)</option>
            <option value="gemini-3.5-flash">gemini-3.5-flash (最新版)</option>
            <option value="gemini-1.5-flash">gemini-1.5-flash (旧版)</option>
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
          
          {result.status === 200 && result.data?.success ? (
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
                {modelName === 'local-gemma2' 
                  ? '※ Ollamaが起動しているか、OLLAMA_ORIGINS="*" が設定されているか確認してください。'
                  : '※ Quota exceeded 等が出ている場合、APIキーがGoogleによって制限されています。'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
