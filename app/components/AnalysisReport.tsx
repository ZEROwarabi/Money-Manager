import React, { useMemo, useEffect, useState } from 'react';
import { CategoryBudget } from '../types';

interface AnalysisReportProps {
  variableCategories: CategoryBudget[];
  variableFreeMoney: number;
  savingsTotal: number;
  onClose?: () => void;
}

export default function AnalysisReport({ variableCategories, variableFreeMoney, savingsTotal, onClose }: AnalysisReportProps) {
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(true);

  const staticReport = useMemo(() => {
    const items: { icon: string; title: string; text: string }[] = [];
    
    // 1. 今月の進捗
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const monthProgress = currentDay / daysInMonth; 
    const progressPercent = Math.round(monthProgress * 100);
    
    items.push({
      icon: '📅',
      title: '今月の進捗',
      text: `今日は${currentDay}日（月の約${progressPercent}%が経過）です。`
    });

    // 2. 全体的なペース
    let totalVariableBudget = 0;
    let totalVariableSpent = 0;
    variableCategories.forEach((c) => {
      totalVariableBudget += (c.budget || 0);
      totalVariableSpent += (c.spent || 0);
    });

    let diff = 0;
    let spendPercent = 0;
    if (totalVariableBudget > 0) {
      const overallSpendRatio = totalVariableSpent / totalVariableBudget;
      spendPercent = Math.round(overallSpendRatio * 100);
      diff = overallSpendRatio - monthProgress;

      if (diff > 0.05) {
        items.push({ icon: '🔴', title: '全体的なペース', text: `支出ペースが少し早いです（消化率 ${spendPercent}%）。一度内訳を見直すのがおすすめです。` });
      } else if (diff < -0.05) {
        items.push({ icon: '🟢', title: '全体的なペース', text: `支出は順調（消化率 ${spendPercent}%）です。この調子でいきましょう！` });
      } else {
        items.push({ icon: '🟡', title: '全体的なペース', text: `経過日数とほぼ同じ支出ペース（消化率 ${spendPercent}%）です。後半は少し意識してみましょう。` });
      }
    }

    // 3. カテゴリ別の状況
    const categoryStatus = variableCategories
      .filter((c) => (c.budget || 0) > 0)
      .map((c) => {
        const budget = c.budget || 0;
        const spent = c.spent || 0;
        const remainRatio = (budget - spent) / budget;
        return { category: c.name || c.category, remainRatio };
      });

    const warningCategories = categoryStatus.filter((c) => c.remainRatio < 0.1);
    const goodCategories = categoryStatus
      .filter((c) => c.remainRatio >= 0.1)
      .sort((a, b) => b.remainRatio - a.remainRatio);

    if (warningCategories.length > 0) {
      const names = warningCategories.map((c) => c.category).join('、');
      items.push({ icon: '⚠️', title: '注意が必要な項目', text: `${names} が予算上限に近づいています。注意してください。` });
    } else if (goodCategories.length > 0) {
      const topGood = goodCategories.slice(0, 2).map((c) => c.category).join('、');
      items.push({ icon: '🌟', title: '素晴らしい節約', text: `${topGood} は十分な余裕があります。見事な管理ですね！` });
    }

    // 4. 余裕資金
    if (totalVariableBudget > 0) {
      const freeRatio = variableFreeMoney / totalVariableBudget;
      if (freeRatio < 0.1) {
        items.push({ icon: '💧', title: '余裕資金', text: `残り $${variableFreeMoney.toLocaleString()} となっています。今週は計画的に使いましょう。` });
      } else {
        items.push({ icon: '💰', title: '余裕資金', text: `現在、自由に使えるお金が $${variableFreeMoney.toLocaleString()} 残っています。` });
      }
    } else {
      if (variableFreeMoney < 50) {
         items.push({ icon: '💧', title: '余裕資金', text: `残り $${variableFreeMoney.toLocaleString()} となっています。今週は計画的に使いましょう。` });
      } else {
         items.push({ icon: '💰', title: '余裕資金', text: `現在、自由に使えるお金が $${variableFreeMoney.toLocaleString()} 残っています。` });
      }
    }

    // 5. 体験投資バケツ
    if (savingsTotal >= 0) {
      items.push({ icon: '💎', title: '体験投資バケツ', text: `これまでに $${savingsTotal.toLocaleString()} の準備金が積み上がっています。未来の特別な体験への準備が着々と進んでいますね！` });
    }

    return items;
  }, [variableCategories, variableFreeMoney, savingsTotal]);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingSummary(true);
    fetch('/api/report-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportItems: staticReport })
    })
    .then(r => r.json())
    .then(data => {
      if (isMounted) {
        if (data.success) {
          setAiSummary(data.advice);
        } else {
          setAiSummary(data.message || '⚠️ AIサーバーが混雑しています。少し待ってからお試しください！');
        }
        setIsLoadingSummary(false);
      }
    })
    .catch(() => {
      if (isMounted) setIsLoadingSummary(false);
    });
    return () => { isMounted = false; };
  }, [staticReport]);

  return (
    <div className="glass-card highlight" style={{ position: 'relative', marginTop: '2rem', textAlign: 'left', borderColor: 'var(--accent-color)' }}>
      {onClose && (
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            opacity: 0.6,
            transition: 'opacity 0.2s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '0.6'}
          title="閉じる"
        >
          ×
        </button>
      )}
      <h2 className="chart-title" style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
        <span>📊</span> 家計分析レポート
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
        {staticReport.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>{item.icon}</span>
            <div>
              <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{item.title}</span>
              <span style={{ color: 'var(--text-secondary)' }}>: {item.text}</span>
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '0.5rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '8px', borderLeft: '4px solid #38bdf8' }}>
          <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>🤖</span>
          <div>
            <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>AIからの総括</span>
            <span style={{ color: 'var(--text-secondary)' }}>: {isLoadingSummary ? <span><span style={{ display: 'inline-block', animation: 'pulse 1.5s infinite opacity' }}>⏳</span> シミュレーション中...</span> : aiSummary}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
