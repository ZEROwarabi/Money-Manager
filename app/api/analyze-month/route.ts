import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { month, expenses, budget, freeMoney, totalSpent, isPastMonth } = await req.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let promptText = '';
    
    if (isPastMonth) {
      promptText = `
あなたは私専属の優秀なファイナンシャルプランナーです。
過去の特定の月（${month}）の家計簿データを分析し、以下の点について具体的なアドバイスを300〜500文字程度で提供してください。
今回は「なぜ支出が高くなったのか（あるいは抑えられたのか）」の要因分析と、次月以降への改善アクションに焦点を当ててください。

【${month}の家計データ】
・全体の変動費予算: $${budget}
・実際の変動費支出: $${totalSpent}
・予算に対する結果: $${freeMoney > 0 ? \`+$$\{freeMoney} (黒字)\` : \`-$$\{Math.abs(freeMoney)} (赤字)\`}

【カテゴリ別支出内訳】
${expenses.map((e: any) => `- ${e.category}: $${e.spent} (予算: $${e.budget || 0})`).join('\n')}

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
・全体の変動費予算: $${budget}
・現在の変動費支出: $${totalSpent}
・現在の余裕資金: $${freeMoney}

【カテゴリ別支出内訳】
${expenses.map((e: any) => `- ${e.category}: $${e.spent} (予算: $${e.budget || 0})`).join('\n')}

上記を踏まえ、
1. 現状のペースに対する評価
2. 月の後半（または来月に向けて）の具体的なアクションプラン
をプロの視点でアドバイスしてください。
`;
    }

    const result = await model.generateContent(promptText);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ success: true, advice: text });
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json({ success: false, message: 'AI分析中にエラーが発生しました。' }, { status: 500 });
  }
}
