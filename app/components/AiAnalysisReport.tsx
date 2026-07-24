import React from 'react';

interface AiAnalysisReportProps {
  aiAdvice: string;
  isAiLoading: boolean;
  isCopied: boolean;
  fetchAiAdvice: () => void;
  copyDataForAi: () => void;
}

export const AiAnalysisReport: React.FC<AiAnalysisReportProps> = ({
  aiAdvice,
  isAiLoading,
  isCopied,
  fetchAiAdvice,
  copyDataForAi
}) => {
  return (
    <div className="ai-report-container">
      <div className="ai-actions">
        <button 
          className={`ai-action-btn primary ${isAiLoading ? 'loading' : ''}`}
          onClick={fetchAiAdvice}
          disabled={isAiLoading}
        >
          <span className="btn-icon">✨</span>
          <span className="btn-text">{isAiLoading ? 'AIが分析中...' : 'AI家計分析を生成する'}</span>
          {isAiLoading && <div className="loader-ring"></div>}
        </button>
        <button 
          className={`ai-action-btn secondary ${isCopied ? 'copied' : ''}`}
          onClick={copyDataForAi}
        >
          <span className="btn-icon">{isCopied ? '✅' : '📋'}</span>
          <span className="btn-text">{isCopied ? 'コピー完了' : 'プロンプトをコピー'}</span>
        </button>
      </div>

      {aiAdvice && (
        <div className="ai-report-card">
          <div className="ai-report-header">
            <div className="ai-avatar">
              <span className="sparkle">✨</span>
            </div>
            <h2 className="ai-report-title">専属AIプランナーからのアドバイス</h2>
          </div>
          <div className="ai-report-content">
            {aiAdvice.split('\n').map((line, i) => {
              // Parse **bold** markdown safely
              const parts = line.split(/(\*\*.*?\*\*)/g);
              return (
                <div key={i} className="ai-report-line">
                  {parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={j} className="ai-highlight">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
