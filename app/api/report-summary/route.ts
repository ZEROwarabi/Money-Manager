import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY が .env.local に設定されていません。' }, { status: 400 });
    }

    const body = await req.json();
    const { reportItems } = body;

    const ai = new GoogleGenAI({ apiKey });

    // Extract the static report data to send to Gemini
    const reportContext = reportItems.map((item: any) => `- ${item.title}: ${item.text}`).join('\n');

    const prompt = `あなたは優しく寄り添う、励まし上手なファイナンシャルプランナーです。
以下の「今月の家計分析レポート」の各項目の結果をもとに、ユーザーへの「AIからの総括（総合的なアドバイスと励ましの言葉）」を100文字〜150文字程度で優しく作成してください。

【今月の家計分析レポート】
${reportContext}

【アドバイスのガイドライン】
- 全体的に、ユーザーのがんばりを肯定し、温かく背中を押すような、優しく励ますトーンにしてください。
- レポートの内容（余裕資金があるか、ピンチか、貯金が進んでいるか）を要約して、具体的なアクションや心の持ち方を1つアドバイスしてください。
- 順調な場合は一緒に喜び、ピンチな場合は「大丈夫ですよ、ここから挽回しましょう！」と前向きに励ましてください。
- 絵文字を適度に使って、読みやすく親しみやすいトーンにしてください。
- アドバイス本文のみを出力し、余計な挨拶やマークダウン装飾は含めないでください。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    return NextResponse.json({ success: true, advice: response.text });
  } catch (error: any) {
    console.error('Report Summary API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || String(error)
    }, { status: 500 });
  }
}
