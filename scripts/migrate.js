require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ エラー: .env.local に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY (または SERVICE_ROLE_KEY) を設定してください。');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🚀 db.json から Supabaseへのデータ移行を開始します...');

  const dbPath = path.join(__dirname, '..', 'data', 'db.json');
  
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ エラー: ${dbPath} が見つかりませんでした。`);
    process.exit(1);
  }

  try {
    const fileData = fs.readFileSync(dbPath, 'utf8');
    const parsedData = JSON.parse(fileData);
    const records = parsedData.records || [];

    if (!Array.isArray(records) || records.length === 0) {
      console.log('⚠️ インポートするレコードがありません（配列が空です）。');
      process.exit(0);
    }

    console.log(`- ${records.length} 件のレコードを読み込みました。変換とアップロードを行います。`);

    const validData = records.map(record => {
      // 必須フィールドの欠損チェック等
      if (!record.date) return null;

      const expense = Number(record.expense) || 0;
      const income = Number(record.income) || 0;
      
      const type = expense > 0 ? 'expense' : 'income';
      const amount = expense > 0 ? expense : income;

      return {
        date: record.date,
        category: record.category || 'その他',
        amount: amount,
        type: type,
        memo: record.description || ''
      };
    }).filter(item => item !== null);

    if (validData.length === 0) {
      console.log('- 有効なデータがありませんでした。');
      process.exit(0);
    }

    // Supabaseへ一括インポート
    const { data, error } = await supabase
      .from('transactions')
      .insert(validData);

    if (error) {
      console.error('❌ インポート中にエラーが発生しました:', error.message);
      process.exit(1);
    }

    console.log(`✅ 合計 ${validData.length} 件のデータを正常にインポートしました！`);
  } catch (err) {
    console.error('❌ JSONパースまたは処理中に予期せぬエラーが発生しました:', err);
    process.exit(1);
  }
}

main();
