const fs = require('fs');

let code = fs.readFileSync('app/page.tsx', 'utf8');

const originalComponent = `      <div style={{ textAlign: 'center', marginTop: '3rem', marginBottom: '1rem', display: 'flex', justifyContent: 'center', gap: '15px' }}>
        <button className="action-button primary" onClick={fetchAiAdvice} disabled={isAiLoading} style={{ fontSize: '1.1rem', padding: '0.8rem 1.8rem', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', opacity: isAiLoading ? 0.7 : 1 }}>
          {isAiLoading ? '📊 レポートを作成中...' : '📊 今月の家計を分析する'}
        </button>
        <button className="action-button secondary" onClick={copyDataForAi} style={{ fontSize: '1.1rem', padding: '0.8rem 1.8rem' }}>
          {isCopied ? '📋 コピーしました！' : '📋 データをコピー (AI用)'}
        </button>
      </div>

      {aiAdvice && (
        <div className="glass-card highlight" style={{ marginTop: '1rem', textAlign: 'left', background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240, 249, 255, 0.8))', borderColor: 'var(--accent-color)' }}>
          <h2 className="chart-title" style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📊</span> 家計分析レポート
          </h2>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            {aiAdvice.split('\\n').map((line, i) => {
              const parts = line.split(/(\\*\\*.*?\\*\\*)/g);
              return (
                <div key={i} style={{ minHeight: '1em' }}>
                  {parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={j} style={{ color: '#0369a1' }}>{part.slice(2, -2)}</strong>;
                    }
                    return part;
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}`;

code = code.replace('<AiAnalysisReport aiAdvice={aiAdvice} isAiLoading={isAiLoading} isCopied={isCopied} fetchAiAdvice={fetchAiAdvice} copyDataForAi={copyDataForAi} />', originalComponent);
code = code.replace("import { AiAnalysisReport } from './components/AiAnalysisReport';\n", '');

fs.writeFileSync('app/page.tsx', code);
console.log('Done');
