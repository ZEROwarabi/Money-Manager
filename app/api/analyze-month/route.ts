import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY が設定されていません。' }, { status: 400 });
    }
    
    const { month, expenses, budget, freeMoney, totalSpent, isPastMonth, historicalDataText, daysPassed, totalDays, activeWishlist } = await req.json();

    const ai = new GoogleGenAI({ apiKey });

    const wishlistText = activeWishlist && activeWishlist.length > 0
      ? `\n【現在購入を検討しているアイテム（使用検討中）】\n${activeWishlist.map((w: any) => `- ${w.name}: $${w.amount} (${w.category})`).join('\n')}\n\n※ユーザーは上記のアイテムを購入するか迷っています。全体の余裕資金や、これまでの支出ペースを踏まえて、「今月これらを買っても問題ないか、あるいは見送るべきか（または来月に回すべきか）」の客観的でプロフェッショナルな判断・アドバイスを必ず含めてください。`
      : '';

    let promptText = '';
    
    if (isPastMonth) {
      promptText = `
あなたは私専属の優秀なファイナンシャルプランナーです。
過去の特定の月（${month}）の家計簿データを分析し、以下の点について具体的なアドバイスを300〜500文字程度で提供してください。
今回は「なぜ支出が高くなったのか（あるいは抑えられたのか）」の要因分析と、次月以降への改善アクションに焦点を当ててください。

【${month}の家計データ】
・月の経過日数: ${daysPassed || 30}日 / ${totalDays || 30}日 (完了)
・全体の変動費予算: $${budget}
・実際の変動費支出: $${totalSpent}
・予算に対する結果: ${freeMoney > 0 ? `+$${freeMoney} (黒字)` : `-$${Math.abs(freeMoney)} (赤字)`}

【カテゴリ別支出内訳】
${expenses.map((e: any) => `- ${e.category}: $${e.spent} (予算: $${e.budget || 0})`).join('\n')}

${historicalDataText ? `【全期間の過去支出履歴（比較・傾向分析用）】\n${historicalDataText}\n\n上記を踏まえ、過去の平均的な支出や季節的な傾向と比較して、この月（${month}）がどうだったかを必ず言及してください。` : ''}

上記を踏まえ、
1. 支出の主要な要因（どの項目が圧迫しているか、など）
2. 今後同じような月があった場合に気をつけるべき改善アクション
をプロの視点で分析してください。
`;
    } else {
      promptText = `
あなたは私専属の優秀なファイナンシャルプランナーです。
今月（${month}）のここまでの家計簿データを分析し、以下の点について具体的なアドバイスを300〜500文字程度で提供してください。

【今月の家計データ】
・月の経過日数: ${daysPassed || 1}日 / ${totalDays || 30}日 (${Math.round(((daysPassed || 1) / (totalDays || 30)) * 100)}%経過)
・全体の変動費予算: $${budget}
・現在の変動費支出: $${totalSpent}
・現在の余裕資金: $${freeMoney}

【カテゴリ別支出内訳】
${expenses.map((e: any) => `- ${e.category}: $${e.spent} (予算: $${e.budget || 0})`).join('\n')}

${historicalDataText ? `【全期間の過去支出履歴（比較・傾向分析用）】\n${historicalDataText}\n\n上記を踏まえ、過去の平均的な支出や傾向と比較して、今月（${month}）のペースがどうなのか（いつもより使いすぎているか等）を必ず言及してください。` : ''}
${wishlistText}

上記を踏まえ、
1. 現状のペースに対する評価
2. 月の後半（または来月に向けて）の具体的なアクションプラン
をプロの視点でアドバイスしてください。
`;
    }
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
    });

    return NextResponse.json({ success: true, advice: response.text });
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json({ success: false, message: 'AI分析中にエラーが発生しました。' }, { status: 500 });
  }
}
