'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { CategoryBudget } from '../types';

interface AnalysisReportProps {
  variableCategories: CategoryBudget[];
  variableFreeMoney: number;
  savingsTotal: number;
}

export default function AnalysisReport({ variableCategories, variableFreeMoney, savingsTotal }: AnalysisReportProps) {
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(true);

  const staticReport = useMemo(() => {
    const tips: string[] = [];
    
    // 1. 今月の進捗（固定表示）
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const monthProgress = currentDay / daysInMonth; // 0.0 ~ 1.0
    const progressPercent = Math.round(monthProgress * 100);
    
    tips.push(`📅 **今月の進捗**: 今日は${currentDay}日（月の約${progressPercent}%が経過）です。`);

    // 2. 全体的なペース（経過率 vs 支出率）
    let totalVariableBudget = 0;
    let totalVariableSpent = 0;
    variableCategories.forEach((c) => {
      totalVariableBudget += (c.budget || 0);
      totalVariableSpent += (c.spent || 0);
    });

    if (totalVariableBudget > 0) {
      const overallSpendRatio = totalVariableSpent / totalVariableBudget;
      const spendPercent = Math.round(overallSpendRatio * 100);
      const diff = overallSpendRatio - monthProgress;

      if (diff > 0.05) {
        tips.push(`🔴 **全体的なペース**: 支出ペースが少し早いです（消化率 ${spendPercent}%）。一度内訳を見直すのがおすすめです。`);
      } else if (diff < -0.05) {
        tips.push(`🟢 **全体的なペース**: 支出は順調（消化率 ${spendPercent}%）です。この調子でいきましょう！`);
      } else {
        tips.push(`🟡 **全体的なペース**: 経過日数とほぼ同じ支出ペース（消化率 ${spendPercent}%）です。後半は少し意識してみましょう。`);
      }
    }

    // 3. カテゴリ別の状況（動的抽出）
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
      .sort((a, b) => b.remainRatio - a.remainRatio); // 残高割合が高い順

    if (warningCategories.length > 0) {
      const names = warningCategories.map((c) => c.category).join('、');
      tips.push(`⚠️ **注意が必要な項目**: ${names} が予算上限に近づいています。注意してください。`);
    } else if (goodCategories.length > 0) {
      const topGood = goodCategories.slice(0, 2).map((c) => c.category).join('、');
      tips.push(`🌟 **素晴らしい節約**: ${topGood} は十分な余裕があります。見事な管理ですね！`);
    }

    // 4. 余裕資金
    if (totalVariableBudget > 0) {
      const freeRatio = variableFreeMoney / totalVariableBudget;
      if (freeRatio < 0.1) {
        tips.push(`💧 **余裕資金**: 残り $${variableFreeMoney.toLocaleString()} となっています。今週は計画的に使いましょう。`);
      } else {
        tips.push(`💰 **余裕資金**: 現在、自由に使えるお金が $${variableFreeMoney.toLocaleString()} 残っています。`);
      }
    } else {
      if (variableFreeMoney < 50) {
         tips.push(`💧 **余裕資金**: 残り $${variableFreeMoney.toLocaleString()} となっています。今週は計画的に使いましょう。`);
      } else {
         tips.push(`💰 **余裕資金**: 現在、自由に使えるお金が $${variableFreeMoney.toLocaleString()} 残っています。`);
      }
    }

    // 5. 体験投資バケツ（目標・積立枠）
    if (savingsTotal >= 0) {
      tips.push(`💎 **体験投資バケツ**: これまでに $${savingsTotal.toLocaleString()} の準備金が積み上がっています。未来の特別な体験への準備が着々と進んでいますね！`);
    }

    return tips;
  }, [variableCategories, variableFreeMoney, savingsTotal]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchLocalAi = async () => {
      try {
        const payloadSummary = {
          variableFreeMoney,
          savingsTotal,
          expenses: variableCategories.map(c => ({ category: c.name || c.category, budget: c.budget, spent: c.spent }))
        };

        const prompt = `あなたはユーザーを最高に励ます、ポジティブで前向きなファイナンシャルチアリーダーです！以下の家計簿サマリーを元に、ユーザーのモチベーションが上がるような明るくてポジティブなワンポイントアドバイスを1〜2文で提供してください。ダメ出しは極力避け、できているところをしっかり褒めて、ワクワクする未来の話をしてください。過度な謙譲語は避け、絵文字を少し交えた自然な丁寧語（です・ます調）で、マークダウン等は使わずプレーンテキストで出力してください。「貯金」という言葉は使わず「体験投資」や「未来への投資」としてください。\n\n【データ】\n${JSON.stringify(payloadSummary)}`;

        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemma2',
            prompt: prompt,
            stream: false
          })
        });

        if (!response.ok) {
          throw new Error('Ollama API response was not ok');
        }

        const data = await response.json();
        if (isMounted && data.response) {
          setAiMessage(`🤖 **AIのひとこと**: ${data.response.trim()}`);
        }
      } catch (err) {
        // gracefully fail and hide
        console.warn('Local AI fetch failed (Ollama may be offline or CORS blocked):', err);
        if (isMounted) {
          setAiMessage(null);
        }
      } finally {
        if (isMounted) {
          setIsAiLoading(false);
        }
      }
    };

    fetchLocalAi();

    return () => {
      isMounted = false;
    };
  }, [variableCategories, variableFreeMoney, savingsTotal]);

  // Helper to render markdown bold
  const renderLine = (line: string) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} style={{ color: '#0369a1' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="glass-card highlight" style={{ marginTop: '2rem', textAlign: 'left', background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240, 249, 255, 0.8))', borderColor: 'var(--accent-color)' }}>
      <h2 className="chart-title" style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
        <span>📊</span> 家計分析レポート
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
        {staticReport.map((line, i) => (
          <div key={`static-${i}`}>
            {renderLine(line)}
          </div>
        ))}
        
        {isAiLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5rem', opacity: 0.6 }}>
            <span style={{ display: 'inline-block', animation: 'pulse 1.5s infinite', color: '#0369a1' }}>🤖 AIアシスタントが分析中...</span>
          </div>
        )}

        {aiMessage && !isAiLoading && (
          <div style={{ 
            marginTop: '0.5rem', 
            padding: '1rem', 
            background: 'rgba(255, 255, 255, 0.7)', 
            borderRadius: '8px', 
            borderLeft: '4px solid #0369a1',
            animation: 'fadeIn 0.5s ease-out'
          }}>
            {renderLine(aiMessage)}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
