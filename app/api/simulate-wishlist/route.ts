import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY が .env.local に設定されていません。' }, { status: 400 });
    }

    const body = await req.json();
    const { itemName, amount, category, categoryRemaining, freeMoney, savingsGoal } = body;

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `あなたは親しみやすく賢いファイナンシャルアシスタントです。
ユーザーが「買いたいもの」をリストに追加しました。以下の財務状況をもとに、この買い物に対するアドバイス（買っていいか、待つべきか、あと何ヶ月待つべきかなど）を100文字〜150文字程度で簡潔に返答してください。

【買いたいもの情報】
- 品名: ${itemName}
- 金額: $${amount}
- 割り当てカテゴリ: ${category}

【ユーザーの現在の財務状況】
- 「${category}」カテゴリの今月の残り予算: $${categoryRemaining}
- 自由に使える余剰資金（フリー資金）: $${freeMoney}
- 毎月の目標貯金額: $${savingsGoal}

【アドバイスのガイドライン】
- 金額が「カテゴリの残り予算」に収まっているなら、「予算内で今すぐ買えます！」とポジティブに後押ししてください。
- カテゴリ予算はオーバーしているが「フリー資金」に収まっている場合、「予算はオーバーしますが、全体の余裕資金を使えば今すぐ購入可能です」と伝えてください。
- どちらにも収まらない（資金不足）の場合、目標貯金額から逆算して「いまの貯金ペースなら、あと約〇ヶ月で買えるようになりますよ！」と前向きに励ましてください。
- 絵文字を適度に使って、読みやすく親しみやすいトーンにしてください。
- アドバイス本文のみを出力し、余計な挨拶やマークダウン装飾は最小限にしてください。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    return NextResponse.json({ success: true, advice: response.text });
  } catch (error: any) {
    console.error('Simulate Wishlist API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || String(error)
    }, { status: 500 });
  }
}
