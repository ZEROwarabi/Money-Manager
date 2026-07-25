require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const INPUT_JSON_PATH = './data/db.json';

async function migrateData() {
  const fileContent = fs.readFileSync(INPUT_JSON_PATH, 'utf8');
  const db = JSON.parse(fileContent);

  // どんな構造のJSONからでも確実に配列データを抽出する
  let records = [];
  if (Array.isArray(db)) {
    records = db;
  } else if (db.transactions && Array.isArray(db.transactions)) {
    records = db.transactions;
  } else {
    for (const key in db) {
      if (Array.isArray(db[key])) {
        records = db[key];
        break;
      }
    }
    if (records.length === 0 && typeof db === 'object') {
      records = Object.values(db);
    }
  }

  console.log(`🚀 ${records.length}件のデータを適切な形に変換中...`);

  if (!Array.isArray(records) || records.length === 0) {
    console.error("❌ エラー: JSONから配列データを抽出できませんでした。");
    process.exit(1);
  }

  // Supabaseのテーブル構造（expense, income）に強制マッピング
  const formattedData = records.map(record => {
    const expenseValue = record.expense !== undefined ? Number(record.expense) : Number(record.amount || 0);
    const incomeValue = record.income !== undefined ? Number(record.income) : 0;

    return {
      date: record.date || null,
      category: record.category || '未分類',
      description: record.description || record.memo || record.name || '',
      expense: isNaN(expenseValue) ? 0 : expenseValue,
      income: isNaN(incomeValue) ? 0 : incomeValue,
      month: record.month || (record.date ? record.date.substring(0, 7) : null),
      record_type: record.record_type || record.type || 'expense_normal',
      reconciled: record.reconciled !== undefined ? record.reconciled : true,
    };
  }).filter(r => r.date !== null);

  console.log('☁️ Supabaseへデータを送信中...');

  const { data, error } = await supabase
    .from('transactions')
    .insert(formattedData);

  if (error) {
    console.error('❌ エラー発生:', error.message);
  } else {
    console.log(`✅ マイグレーション完了！${formattedData.length}件のデータがSupabaseに送信されました。`);
  }
}

migrateData();