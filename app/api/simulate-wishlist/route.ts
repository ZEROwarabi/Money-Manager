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

    const prompt = `あなたは優しく寄り添う、励まし上手なファイナンシャルプランナーです。
ユーザーが「買いたいもの」をリストに追加しました。以下の財務状況をもとに、この買い物に対するアドバイス（買っていいか、待つべきか、あと何ヶ月待つべきかなど）を100文字〜150文字程度で優しく簡潔に返答してください。

【買いたいもの情報】
- 品名: ${itemName}
- 金額: $${amount}
- 割り当てカテゴリ: ${category}

【ユーザーの現在の財務状況】
- 「${category}」カテゴリの今月の残り予算: $${categoryRemaining}
- 自由に使える余剰資金（フリー資金）: $${freeMoney}
- 毎月の目標貯金額: $${savingsGoal}

【アドバイスのガイドライン】
- 全体的に、ユーザーのがんばりを肯定し、温かく背中を押すような、優しく励ますトーンにしてください。
- 金額が「カテゴリの残り予算」に収まっているなら、「わぁ、予算内で買えちゃいますね！ぜひ楽しんでください！」とポジティブに後押ししてください。
- カテゴリ予算はオーバーしているが「フリー資金」に収まっている場合、「カテゴリ予算は超えちゃいますが、全体の余裕資金で十分カバーできますよ。買っちゃっても大丈夫です！」と安心させてください。
- どちらにも収まらない（資金不足）の場合、目標貯金額から逆算して「今の素敵な貯金ペースなら、あと約〇ヶ月で買えるようになりますよ！一緒にがんばりましょうね！」と前向きに励ましてください。
- 絵文字を適度に使って、読みやすく親しみやすいトーンにしてください。
- アドバイス本文のみを出力し、余計な挨拶やマークダウン装飾は含めないでください。`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });
    } catch (e: any) {
      console.warn('gemini-3.5-flash failed, falling back to gemini-1.5-flash', e.message);
      response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
      });
    }

    return NextResponse.json({ success: true, advice: response.text });
  } catch (error: any) {
    console.error('Simulate Wishlist API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || String(error)
    }, { status: 500 });
  }
}
