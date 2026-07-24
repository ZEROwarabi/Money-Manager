require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { createClient } = require('@supabase/supabase-js');

// 1. Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ エラー: .env.local に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY (または SERVICE_ROLE_KEY) を設定してください。');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 読み込む対象のCSVファイルリスト
const CSV_FILES = [
  'アメリカでの支払い_入力.csv',
  'アメリカでの支払い_分析.csv'
];

/**
 * CSVファイルを読み込んでパースする
 */
async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ 警告: ${filePath} が見つかりませんでした。スキップします。`);
      return resolve([]);
    }

    fs.createReadStream(filePath)
      .pipe(parse({
        columns: true, // 1行目をヘッダーとして扱う（ヘッダーがない場合はfalseにし、配列として処理）
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true
      }))
      .on('data', (data) => {
        // 空行や不正な行のスキップ処理
        if (!data || Object.keys(data).length === 0) return;
        results.push(data);
      })
      .on('error', (error) => reject(error))
      .on('end', () => resolve(results));
  });
}

/**
 * 日本語のCSVデータをSupabaseのテーブルスキーマに変換
 * ※必要に応じて実際のCSVの列名（日付、カテゴリ、金額、メモなど）に合わせて変更してください
 */
function transformRow(row) {
  // 日付のパース（空の場合はスキップするためnullを返す）
  const dateStr = row['日付'] || row['date'] || row['Date'];
  if (!dateStr) return null;

  // 金額のパース（$マークやカンマを除去）
  let amountStr = row['金額'] || row['amount'] || row['Amount'] || '0';
  amountStr = amountStr.replace(/[$,]/g, '');
  const amount = parseFloat(amountStr);
  if (isNaN(amount)) return null;

  // カテゴリとメモ
  const category = row['カテゴリ'] || row['category'] || row['Category'] || 'その他';
  const memo = row['メモ'] || row['memo'] || row['Memo'] || '';
  const type = amount >= 0 ? 'expense' : 'income'; // 必要に応じて判定ロジックを調整してください

  return {
    date: dateStr,
    category: category,
    amount: Math.abs(amount), // 正の値として保存
    type: type,
    memo: memo
  };
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 Supabaseへのデータ移行を開始します...');
  let totalImported = 0;

  for (const fileName of CSV_FILES) {
    const filePath = path.join(__dirname, '..', fileName);
    console.log(`\n📄 処理中: ${fileName}`);
    
    try {
      const records = await parseCSV(filePath);
      if (records.length === 0) continue;

      console.log(`- ${records.length} 件のレコードを読み込みました。変換とアップロードを行います。`);

      const validData = records
        .map(transformRow)
        .filter(item => item !== null); // 変換に失敗した行（空行など）を除外

      if (validData.length === 0) {
        console.log('- 有効なデータがありませんでした。');
        continue;
      }

      // Supabaseへ一括インポート (バルクインサート)
      // テーブル名は環境に合わせて 'transactions' 等に変更してください
      const { data, error } = await supabase
        .from('transactions')
        .insert(validData);

      if (error) {
        console.error(`❌ ${fileName} のインポート中にエラーが発生しました:`, error.message);
      } else {
        console.log(`✅ ${fileName}: ${validData.length} 件のデータを正常にインポートしました。`);
        totalImported += validData.length;
      }
    } catch (err) {
      console.error(`❌ ${fileName} の処理中に予期せぬエラーが発生しました:`, err);
    }
  }

  console.log(`\n🎉 すべての処理が完了しました！ 合計 ${totalImported} 件のデータをSupabaseへ移行しました。`);
}

main();
