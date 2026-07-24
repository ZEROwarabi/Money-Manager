const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function runMigration() {
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  const db = JSON.parse(data);
  let recordsModified = 0;
  let settingsModified = 0;

  // 1. Records
  if (db.records && Array.isArray(db.records)) {
    db.records = db.records.map(record => {
      if (record.category === 'スプリングブレイク' || record.category === 'World Cup/Houston') {
        record.eventTag = record.category;
        record.category = '特別体験・イベント費';
        recordsModified++;
      } else if (record.category === '生活品費') {
        record.category = '環境・自己投資';
        recordsModified++;
      }
      return record;
    });
  }

  // 2. Monthly Settings
  if (db.monthlySettings) {
    Object.keys(db.monthlySettings).forEach(month => {
      const monthData = db.monthlySettings[month];
      if (monthData && Array.isArray(monthData.fixedExpenses)) {
        const oldLength = monthData.fixedExpenses.length;
        monthData.fixedExpenses = monthData.fixedExpenses.filter(expense => {
          const name = expense.name;
          const amount = parseFloat(expense.amount) || 0;
          
          if ((name === 'スプリングブレイク' || name === 'World Cup/Houston') && amount === 0) {
            return false;
          }
          return true;
        }).map(expense => {
          if (expense.name === '生活品費') {
            expense.name = '環境・自己投資';
          }
          return expense;
        });

        if (monthData.fixedExpenses.length !== oldLength || monthData.fixedExpenses.some(e => e.name === '環境・自己投資')) {
          settingsModified++;
        }
      }
    });
  }

  // 3. Ignored Categories
  if (db.ignoredBudgetCategories) {
    db.ignoredBudgetCategories = ['特別体験・イベント費'];
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  console.log(`Migration completed successfully!`);
  console.log(`Records modified: ${recordsModified}`);
  console.log(`Monthly settings modified: ${settingsModified}`);
}

runMigration();
