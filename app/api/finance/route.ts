async function readDB() {
  let parsed = { 
    records: [], 
    monthlySettings: {},
    accounts: [
      { id: 'main', name: 'メイン口座' },
      { id: 'savings', name: '貯金口座' }
    ]
  };

  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    const p = JSON.parse(data);
    if (p.monthlySettings) parsed.monthlySettings = p.monthlySettings;
    if (p.accounts) parsed.accounts = p.accounts;
    if (p.categoryBudgets) parsed.categoryBudgets = p.categoryBudgets;
    if (p.wishlist) parsed.wishlist = p.wishlist;
    if (p.ignoredBudgetCategories) parsed.ignoredBudgetCategories = p.ignoredBudgetCategories;
  } catch (error) {
    console.warn('Local db.json not readable, using fallback for settings:', error);
  }

  try {
    const supabase = getSupabase();
    const { data: txs, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: true });
    if (error) {
      console.error('Supabase fetch error:', error);
    }
    if (txs) {
      parsed.records = txs.map(t => ({
        ...t,
        recordType: t.record_type,
        expense: Number(t.expense),
        income: Number(t.income)
      }));
    }
  } catch (error) {
    console.error('Supabase connection error in readDB:', error);
  }

  return parsed;
}

async function readDB() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    
    // Supabaseからトランザクションを取得
    const supabase = getSupabase();
    const { data: txs } = await supabase.from('transactions').select('*').order('created_at', { ascending: true });
    if (txs) {
      parsed.records = txs.map(t => ({
        ...t,
        recordType: t.record_type,
        expense: Number(t.expense),
        income: Number(t.income)
      }));
    } else {
      parsed.records = [];
    }

    if (!parsed.monthlySettings) parsed.monthlySettings = {};
    if (!parsed.accounts) {
      parsed.accounts = [
        { id: 'main', name: 'メイン口座' },
        { id: 'savings', name: '貯金口座' }
      ];
    }
    return parsed;
  } catch (error) {
    return { 
      records: [], 
      monthlySettings: {},
      accounts: [
        { id: 'main', name: 'メイン口座' },
        { id: 'savings', name: '貯金口座' }
      ]
    };
  }
}

async function writeDB(data: Database) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function generateRuleBasedAdvice(payload: any): string {
  const tips: string[] = [];
  const expenses = payload?.monthlyExpenses || [];
  const freeMoney = payload?.variableFreeMoney ?? 0;
  const savingsTotal = payload?.savingsTotal ?? 0;
  
  // 今月の進行度（日付から計算）
  const today = new Date();
  const currentDay = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const monthProgress = currentDay / daysInMonth; // 0.0 ~ 1.0

  let totalVariableBudget = 0;
  let totalVariableSpent = 0;

  // 1. 各カテゴリの詳細なペース分析
  const fastPaced: string[] = [];
  const overBudget: string[] = [];
  const superSavers: string[] = [];

  expenses.forEach((c: { category: string; budget: number; spent: number; }) => {
    const budget = c.budget || 0;
    const spent = c.spent || 0;
    totalVariableBudget += budget;
    totalVariableSpent += spent;

    if (budget > 0) {
      const spendRatio = spent / budget;
      if (spendRatio >= 1.0) {
        overBudget.push(c.category);
      } else if (spendRatio > monthProgress + 0.15) {
        // 月の進行度より15%以上早く消費している
        fastPaced.push(c.category);
      } else if (spendRatio < monthProgress - 0.2) {
        // 月の進行度より20%以上遅い（節約できている）
        superSavers.push(c.category);
      }
    }
  });

  // レポート生成開始
  tips.push(`🗓 **今月の進捗**: 今日は${currentDay}日（月の約${Math.round(monthProgress * 100)}%が経過）です。`);

  // 全体のペース判定
  if (totalVariableBudget > 0) {
    const overallSpendRatio = totalVariableSpent / totalVariableBudget;
    if (overallSpendRatio > monthProgress + 0.1) {
      tips.push(`⚠️ **全体的なペース**: 予算に対して支出ペースがやや早め（消化率 ${Math.round(overallSpendRatio * 100)}%）です。後半は引き締めを意識しましょう！`);
    } else if (overallSpendRatio <= monthProgress) {
      tips.push(`🟢 **全体的なペース**: 支出ペースは非常に順調（消化率 ${Math.round(overallSpendRatio * 100)}%）です。この調子でキープしましょう！`);
    }
  }

  // カテゴリ別の警告と称賛
  if (overBudget.length > 0) {
    tips.push(`🔴 **予算超過**: ${overBudget.join('、')} がすでに予算をオーバーしています。他のカテゴリでカバーできるか確認してください。`);
  }
  
  if (fastPaced.length > 0) {
    tips.push(`🟡 **要注意**: ${fastPaced.join('、')} の出費ペースが少し早いです。月末に向けて調整をおすすめします。`);
  }

  if (superSavers.length > 0) {
    tips.push(`🌟 **素晴らしい節約**: ${superSavers.join('、')} は予算に対してかなり余裕があります。見事な管理です！`);
  }

  // 貯金とフリーマネー
  if (freeMoney > 0) {
    tips.push(`💰 **余裕資金**: 現在、純粋に自由に使えるお金が **$${freeMoney.toLocaleString()}** 残っています。`);
  } else if (freeMoney < 0) {
    tips.push(`🚨 **資金ショートの兆候**: カテゴリ残高の合計に対して、全体の残高が不足しています。口座の入出金漏れがないか確認してください。`);
  }

  if (savingsTotal > 0) {
    tips.push(`💎 **体験投資バケツ**: これまでに **$${savingsTotal.toLocaleString()}** の特別体験・イベント準備金が積み上がっています。未来の特別な体験への準備が着々と整っていますね！`);
  }

  if (tips.length === 1) {
    tips.push(`📝 支出をカテゴリーごとに記録していくと、ここで詳しい分析レポートが見られるようになります！`);
  }

  return tips.join('\n\n');
}

export async function GET() {
  try {
    const db = await readDB();
    const rows = db.records || [];
    const wishlist = db.wishlist || [];
    const ignoredBudgetCategories = db.ignoredBudgetCategories || [];

    let totalIncome = 0;
    let totalExpense = 0;
    let currentBalance = 0;
    
    const expensesByCategory: Record<string, number> = {};
    const monthlyDataMap: Record<string, { income: number, expense: number, categories: Record<string, number> }> = {};
    let unrecoveredAdvance = 0;
    let unsettledSandbox = 0;

    if (rows && rows.length > 0) {
      rows.forEach((row: any) => {
        const category = row.category || 'その他';
        const expense = parseFloat(row.expense) || 0;
        const income = parseFloat(row.income) || 0;
        const month = row.month || '不明';
        const recordType = row.recordType || 'expense_normal';

        totalIncome += income;
        totalExpense += expense;
        
        if (recordType === 'advance_payment') unrecoveredAdvance += expense;
        if (recordType === 'advance_recovery') unrecoveredAdvance -= income;

        if (recordType === 'trip_sandbox') unsettledSandbox += expense;

        const isExcludedExpense = recordType === 'advance_payment' || recordType === 'trip_sandbox' || recordType === 'trip_sandbox_settled';
        const isExcludedIncome = recordType === 'advance_recovery' || recordType === 'income_special' || recordType === 'trip_reconcile';

        if (expense !== 0 && category !== '入金' && !isExcludedExpense) {
          expensesByCategory[category] = (expensesByCategory[category] || 0) + expense;
        }

        if (!monthlyDataMap[month]) {
          monthlyDataMap[month] = { income: 0, expense: 0, categories: {} };
        }
        
        if (!isExcludedIncome) {
          monthlyDataMap[month].income += income;
        }
        if (!isExcludedExpense) {
          monthlyDataMap[month].expense += expense;
        }
        
        if (expense !== 0 && category !== '入金' && !isExcludedExpense) {
          monthlyDataMap[month].categories[category] = (monthlyDataMap[month].categories[category] || 0) + expense;
        }
      });
    }

    currentBalance = totalIncome - totalExpense;

    const expenseData = Object.keys(expensesByCategory).map(key => ({
      name: key,
      value: expensesByCategory[key]
    })).sort((a, b) => b.value - a.value);

    const monthlyData = Object.keys(monthlyDataMap)
      .filter(key => key !== '不明')
      .map(key => ({
        name: key,
        収入: monthlyDataMap[key].income,
        支出: monthlyDataMap[key].expense,
        ...monthlyDataMap[key].categories
      })).sort((a, b) => a.name.localeCompare(b.name));

    // Group actual payments per month per category
    const actualPaymentsByMonthCategory: Record<string, Record<string, number>> = {};
    if (rows && rows.length > 0) {
      rows.forEach((row: any) => {
        const expense = parseFloat(row.expense) || 0;
        const month = row.month;
        const category = row.category;
        const recordType = row.recordType || 'expense_normal';
        const isExcludedExpense = recordType === 'advance_payment' || recordType === 'trip_sandbox' || recordType === 'trip_sandbox_settled';
        
        if (expense !== 0 && month && category && !isExcludedExpense) {
          if (!actualPaymentsByMonthCategory[month]) actualPaymentsByMonthCategory[month] = {};
          actualPaymentsByMonthCategory[month][category] = (actualPaymentsByMonthCategory[month][category] || 0) + expense;
        }
      });
    }

    // Calculate Savings and Future Fixed Expenses
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    let pastSavings = 0;
    let plannedSavings = 0;
    
    Object.keys(db.monthlySettings).forEach(month => {
      const savingsGoal = parseFloat(db.monthlySettings[month].savingsGoal) || 0;
      if (month < currentMonthStr) {
        pastSavings += savingsGoal;
      } else {
        plannedSavings += savingsGoal;
      }
    });

    const currentMonthSettings = db.monthlySettings[currentMonthStr] || { fixedExpenses: DEFAULT_FIXED_EXPENSES, savingsGoal: 0 };
    
    const activeCategories = currentMonthSettings.fixedExpenses.filter((item: any) => !ignoredBudgetCategories.includes(item.name));
    
    let totalReservedForCategories = 0;

    // Define Category Rules
    const CATEGORY_RULES: Record<string, { isRolloverEnabled: boolean, maxPoolCap?: number, overflowAction?: 'DISCARD' | 'TRANSFER_TO_EVENT_FUND' }> = {
      '環境・自己投資': { isRolloverEnabled: true, maxPoolCap: 350, overflowAction: 'DISCARD' },
      '衣服代': { isRolloverEnabled: true, maxPoolCap: 250, overflowAction: 'DISCARD' },
      '娯楽・リフレッシュ費': { isRolloverEnabled: true, maxPoolCap: 150, overflowAction: 'TRANSFER_TO_EVENT_FUND' },
      '食費': { isRolloverEnabled: false, maxPoolCap: 0, overflowAction: 'TRANSFER_TO_EVENT_FUND' }
    };

    let totalTransferredToEventFund = 0;
    const pastAndCurrentMonths = Object.keys(db.monthlySettings).filter(m => m <= currentMonthStr).sort();

    // Category Budgets Breakdown (with Rollover and Capping)
    const categoryBudgets = activeCategories.map((item: any) => {
      const catName = item.name;
      const rule = CATEGORY_RULES[catName] || { isRolloverEnabled: false };
      let currentRollover = 0;
      
      let currentData = { budgetAmount: 0, carriedOver: 0, pool: 0, spent: 0, remaining: 0, isCapped: false, overflowAmount: 0 };
      
      pastAndCurrentMonths.forEach(month => {
        const isCurrentMonth = month === currentMonthStr;
        const pastBudgetItem = db.monthlySettings[month]?.fixedExpenses?.find((f: any) => f.name === catName);
        const budgetAmount = pastBudgetItem ? parseFloat(pastBudgetItem.amount) || 0 : 0;
        const spentAmount = (actualPaymentsByMonthCategory[month] && actualPaymentsByMonthCategory[month][catName]) ? actualPaymentsByMonthCategory[month][catName] : 0;
        
        let pool = budgetAmount;
        if (rule.isRolloverEnabled && currentRollover > 0) {
           pool += currentRollover;
        } else if (rule.isRolloverEnabled && currentRollover < 0) {
           // Subtract negative rollover (overspending) from new budget
           pool += currentRollover;
        }

        let overflow = 0;
        let isCapped = false;
        if (rule.maxPoolCap !== undefined && pool > rule.maxPoolCap) {
           overflow = pool - rule.maxPoolCap;
           pool = rule.maxPoolCap;
           isCapped = true;
        }
        
        if (overflow > 0 && rule.overflowAction === 'TRANSFER_TO_EVENT_FUND') {
           totalTransferredToEventFund += overflow;
        }
        
        if (isCurrentMonth) {
           currentData = {
              budgetAmount,
              carriedOver: rule.isRolloverEnabled ? currentRollover : 0,
              pool,
              spent: spentAmount,
              remaining: pool - spentAmount,
              isCapped,
              overflowAmount: overflow
           };
        } else {
           let remaining = pool - spentAmount;
           if (remaining > 0) {
              if (!rule.isRolloverEnabled) {
                 if (rule.overflowAction === 'TRANSFER_TO_EVENT_FUND') {
                    totalTransferredToEventFund += remaining;
                 }
                 currentRollover = 0;
              } else {
                 currentRollover = remaining;
              }
           } else {
              currentRollover = rule.isRolloverEnabled ? remaining : 0;
           }
        }
      });
      
      const remaining = currentData.remaining;

      // Calculate future reserved (months after current)
      let futureReserved = 0;
      Object.keys(db.monthlySettings).forEach(month => {
        if (month > currentMonthStr) {
           const fItem = db.monthlySettings[month].fixedExpenses.find((f: any) => f.name === item.name);
           if (fItem) {
             const fBudget = parseFloat(fItem.amount) || 0;
             const fSpent = (actualPaymentsByMonthCategory[month] && actualPaymentsByMonthCategory[month][item.name]) ? actualPaymentsByMonthCategory[month][item.name] : 0;
             futureReserved += Math.max(0, fBudget - fSpent);
           }
        }
      });
      
      // Total reserved for this category across all time
      const bucketBalance = remaining + futureReserved;
      if (bucketBalance > 0) {
        totalReservedForCategories += bucketBalance;
      }

      return {
        name: catName,
        budget: currentData.pool, // effectively the pool
        spent: currentData.spent,
        remaining: currentData.remaining,
        futureReserved,
        originalBudget: currentData.budgetAmount,
        carriedOver: currentData.carriedOver,
        isCapped: currentData.isCapped,
        overflowAmount: currentData.overflowAmount,
        rule
      };
    });
    
    let currentMonthVariableExpenses = 0;
    const fixedCategoryNames = currentMonthSettings.fixedExpenses
      .filter((f: any) => !ignoredBudgetCategories.includes(f.name))
      .map((f: any) => f.name);
    if (rows && rows.length > 0) {
      rows.forEach((row: any) => {
        const recordType = row.recordType || 'expense_normal';
        const isExcludedExpense = recordType === 'advance_payment' || recordType === 'trip_sandbox' || recordType === 'trip_sandbox_settled';
        if (row.month === currentMonthStr) {
          const expense = parseFloat(row.expense) || 0;
          const category = row.category || 'その他';
          if (expense !== 0 && category !== '入金' && !fixedCategoryNames.includes(category) && !isExcludedExpense) {
            currentMonthVariableExpenses += expense;
          }
        }
      });
    }

    // Add transferred funds to 特別体験・イベント費 (Event Fund)
    const eventFundCategory = categoryBudgets.find((c: any) => c.name === '特別体験・イベント費');
    if (eventFundCategory) {
      eventFundCategory.budget += totalTransferredToEventFund;
      eventFundCategory.remaining += totalTransferredToEventFund;
      eventFundCategory.transferredIn = totalTransferredToEventFund;
    }

    const realBalance = currentBalance - pastSavings - plannedSavings - totalReservedForCategories - totalTransferredToEventFund;

    const accountBalances = [
      { id: 'main', name: 'メイン口座 (実質)', balance: realBalance },
      { id: 'savings', name: '貯金口座', past: pastSavings, planned: plannedSavings, total: pastSavings + plannedSavings },
      { id: 'current_variable', name: '今月の変動費', balance: currentMonthVariableExpenses }
    ];

    let advice = '「✨ AIにアドバイスをもらう」ボタンを押すと、今月の状況をAIが分析します！';

    return NextResponse.json({
      success: true,
      data: {
        records: rows,
        summary: { currentBalance, unrecoveredAdvance, unsettledSandbox },
        expenseData,
        monthlyData,
        accountBalances,
        monthlySettings: db.monthlySettings,
        categoryBudgets,
        wishlist,
        ignoredBudgetCategories,
        advice
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await readDB();

    if (body.action === 'import_csv') {
      const csvData = body.csv;
      const parsed = parse(csvData, {
        skip_empty_lines: true,
        trim: true,
        from_line: 2
      });

      const newRecords = parsed.map((row: string[]) => {
  if (row[0] && row[0].match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const parts = row[0].split('/');
    const formattedDate = `${parts[2]}/${parts[0]}/${parts[1]}`;
    const amount = parseFloat(row[2]) || 0;
    const isExpense = amount < 0;
    return {
      date: formattedDate,
      description: row[1] || '',
      category: '',
      expense: isExpense ? Math.abs(amount) : 0,
      income: !isExpense ? amount : 0,
      balance: 0,
      month: `${parts[2]}-${parts[0]}`
    };
  } else {
    return {
      description: row[0] || '',
      date: row[1] || '',
      category: row[2] || '',
      expense: parseFloat(row[3]) || 0,
      income: parseFloat(row[4]) || 0,
      balance: parseFloat(row[5]) || 0,
      month: row[6] || ''
    };
  }
});

      return NextResponse.json({ success: true, records: newRecords });

    } else if (body.action === 'batch_reconcile') {
      const { reconciledIds, newRecords } = body.payload;
      
      if (reconciledIds && Array.isArray(reconciledIds)) {
        db.records = db.records.map((r: any, idx: number) => {
          if (reconciledIds.includes(idx)) {
            return { ...r, reconciled: true };
          }
          return r;
        });
      }

      if (newRecords && Array.isArray(newRecords)) {
        newRecords.forEach((r: any) => {
          db.records.push({ ...r, reconciled: true });
        });
      }

      await writeDB(db);
      return NextResponse.json({ success: true, message: '照合が完了しました。' });
    } else if (body.action === 'export_db') {
      return NextResponse.json({ success: true, db });

    } else if (body.action === 'import_db') {
      const importedDb = body.payload;
      if (!importedDb || !importedDb.records) {
        return NextResponse.json({ error: '無効なバックアップデータです' }, { status: 400 });
      }
      await writeDB(importedDb);
      return NextResponse.json({ success: true, message: 'データを復元しました。' });

    } else if (body.action === 'add_expense') {
      const { date, category, description, amount, recordType } = body.payload;
      
      let expenseAmount = parseFloat(amount) || 0;
      let incomeAmount = 0;

      if (recordType === 'income_allowance' || recordType === 'income_special' || recordType === 'advance_recovery') {
        incomeAmount = Math.abs(expenseAmount);
        expenseAmount = 0;
      } else if (recordType === 'refund') {
        expenseAmount = -Math.abs(expenseAmount);
      } else {
        expenseAmount = Math.abs(expenseAmount);
      }
      
      let month = '不明';
      if (date) {
        const parts = date.split('/');
        if (parts.length >= 2) {
          month = `${parts[0]}-${parts[1].padStart(2, '0')}`;
        } else if (date.includes('-')) {
           const p = date.split('-');
           month = `${p[0]}-${p[1]}`;
        }
      }

      const supabase = getSupabase();
      const { error } = await supabase.from('transactions').insert({
        description: description || '',
        date: date || '',
        category: category || '',
        expense: expenseAmount,
        income: incomeAmount,
        month: month,
        record_type: recordType || 'expense_normal',
        reconciled: false
      });

      if (error) {
        console.error('Supabase Insert Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: '記録を追加しました。' });

    } else if (body.action === 'trip_reconcile') {
      const { date, myShare, recovered } = body.payload;
      
      const share = parseFloat(myShare) || 0;
      const recov = parseFloat(recovered) || 0;
      const totalSandbox = share + recov;

      let month = '不明';
      if (date) {
        const parts = date.split('/');
        if (parts.length >= 2) {
          month = `${parts[0]}-${parts[1].padStart(2, '0')}`;
        }
      }

      for (let i = 0; i < db.records.length; i++) {
        if (db.records[i].recordType === 'trip_sandbox') {
          db.records[i].recordType = 'trip_sandbox_settled';
        }
      }

      db.records.push({
        description: `旅行一括精算 (総額$${totalSandbox.toFixed(2)} / 回収$${recov.toFixed(2)})`,
        date: date || '',
        category: '特別体験・イベント費',
        expense: share,
        income: recov,
        balance: 0,
        month: month,
        recordType: 'trip_reconcile'
      });

      let currentBalance = 0;
      for (let i = 0; i < db.records.length; i++) {
        currentBalance += (parseFloat(db.records[i].income) || 0) - (parseFloat(db.records[i].expense) || 0);
        db.records[i].balance = currentBalance;
      }

      await writeDB(db);
      return NextResponse.json({ success: true, message: '旅行の精算が完了しました。' });

    } else if (body.action === 'update_monthly_settings') {
      const { month, fixedExpenses, savingsGoal } = body.payload;
      db.monthlySettings[month] = {
        fixedExpenses,
        savingsGoal: parseFloat(savingsGoal) || 0
      };
      await writeDB(db);
      return NextResponse.json({ success: true, message: '月間設定を更新しました。' });

    } else if (body.action === 'delete_monthly_settings') {
      const { month } = body.payload;
      if (db.monthlySettings && db.monthlySettings[month]) {
        delete db.monthlySettings[month];
        await writeDB(db);
      }
      return NextResponse.json({ success: true, message: '月間設定を削除しました。' });
      
    } else if (body.action === 'add_wishlist') {
      const { id, name, amount, category } = body.payload;
      if (!db.wishlist) db.wishlist = [];
      db.wishlist.push({ id, name, amount: parseFloat(amount) || 0, category, isApplied: true });
      await writeDB(db);
      return NextResponse.json({ success: true, message: '欲しいものを追加しました。' });
      
    } else if (body.action === 'toggle_wishlist') {
      const { id, isApplied } = body.payload;
      if (db.wishlist) {
        const item = db.wishlist.find((w: WishlistItem) => w.id === id);
        if (item) item.isApplied = isApplied;
        await writeDB(db);
      }
      return NextResponse.json({ success: true, message: '状態を更新しました。' });
      
    } else if (body.action === 'delete_wishlist') {
      const { id } = body.payload;
      if (db.wishlist) {
        db.wishlist = db.wishlist.filter((w: WishlistItem) => w.id !== id);
        await writeDB(db);
      }
      return NextResponse.json({ success: true, message: '削除しました。' });
      
    } else if (body.action === 'update_wishlist') {
      const { id, name, amount, category } = body.payload;
      if (db.wishlist) {
        const item = db.wishlist.find((w: WishlistItem) => w.id === id);
        if (item) {
          item.name = name;
          item.amount = parseFloat(amount) || 0;
          item.category = category;
        }
        await writeDB(db);
      }
      return NextResponse.json({ success: true, message: '更新しました。' });
      
    } else if (body.action === 'toggle_ignored_budget_category') {
      const { category, isIgnored } = body.payload;
      if (!db.ignoredBudgetCategories) db.ignoredBudgetCategories = [];
      if (isIgnored && !db.ignoredBudgetCategories.includes(category)) {
        db.ignoredBudgetCategories.push(category);
      } else if (!isIgnored) {
        db.ignoredBudgetCategories = db.ignoredBudgetCategories.filter((c: string) => c !== category);
      }
      await writeDB(db);
      return NextResponse.json({ success: true, message: '設定を更新しました。' });
    } else if (body.action === 'transfer_budget') {
      const { month, fromCategory, toCategory, amount } = body.payload;
      const transferAmount = parseFloat(amount);
      
      if (!db.monthlySettings[month]) {
        return NextResponse.json({ error: '対象月の予算設定が見つかりません' }, { status: 400 });
      }
      
      const fixed = db.monthlySettings[month].fixedExpenses;
      
      let fromItem = fixed.find((f: FixedExpense) => f.name === fromCategory);
      if (!fromItem) {
        fromItem = { id: `cat_${Date.now()}_1`, name: fromCategory, amount: 0 };
        fixed.push(fromItem);
      }
      
      let toItem = fixed.find((f: FixedExpense) => f.name === toCategory);
      if (!toItem) {
        toItem = { id: `cat_${Date.now()}_2`, name: toCategory, amount: 0 };
        fixed.push(toItem);
      }
      
      fromItem.amount = (parseFloat(fromItem.amount) - transferAmount).toString();
      toItem.amount = (parseFloat(toItem.amount) + transferAmount).toString();
      
      await writeDB(db);
      return NextResponse.json({ success: true, message: '予算を移動しました' });

    } else if (body.action === 'get_ai_advice') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: 'GEMINI_API_KEY が設定されていません。' }, { status: 400 });
      }

      const promptData = body.payload;
      const prompt = `あなたは優秀なファイナンシャルアドバイザーです。
以下のユーザーの今月の家計簿サマリーデータを見て、1〜3つの具体的なアドバイスや気づきを提供してください。
なるべく優しく、モチベーションが上がるようなトーンでお願いします。文章は箇条書きや改行を使って見やすくしてください。
なお、このユーザーは「貯金」という概念を廃止し、「特別体験・イベント準備金（体験投資バケツ）」として未来の経験資本に投資する財務戦略を取っています。アドバイス内で「貯金」という言葉は絶対に使わず、「体験投資」や「未来への投資」などの言葉を使ってください。

【家計データ】
${JSON.stringify(promptData, null, 2)}
`;

      // モデルを順番に試す（flash-lite は別クォータ枠の可能性あり）
      const modelsToTry = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];
      
      for (const modelName of modelsToTry) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
          });
          return NextResponse.json({ success: true, advice: response.text });
        } catch (aiError: unknown) {
          const err = aiError as Error;
          console.error(`Gemini API Error (${modelName}):`, err?.message || err);
          // 最後のモデルでも失敗したらルールベースにフォールバック
          if (modelName === modelsToTry[modelsToTry.length - 1]) {
            console.error("全モデル失敗。ルールベースにフォールバック。");
            const ruleAdvice = generateRuleBasedAdvice(promptData);
            return NextResponse.json({ success: true, advice: ruleAdvice, source: 'rule-based' });
          }
        }
      }
    } else if (body.action === 'edit_record' || body.action === 'delete_record') {
      const { index, ...payload } = body.payload;
      if (index >= 0 && index < db.records.length) {
        const targetRecord = db.records[index];
        const supabase = getSupabase();
        
        if (body.action === 'delete_record') {
          await supabase.from('transactions').delete().eq('id', targetRecord.id);
        } else {
          let exp = parseFloat(payload.expense) || 0;
          let inc = parseFloat(payload.income) || 0;
          const recType = payload.recordType || targetRecord.recordType;
          
          if (recType === 'income_allowance' || recType === 'income_special' || recType === 'advance_recovery') {
            inc = Math.abs(exp || inc);
            exp = 0;
          } else if (recType === 'refund') {
            exp = -Math.abs(exp || inc);
            inc = 0;
          } else if (recType === 'advance_payment' || recType === 'expense_normal') {
            exp = Math.abs(exp || inc);
            inc = 0;
          }

          await supabase.from('transactions').update({
            description: payload.description || '',
            date: payload.date || '',
            category: payload.category || '',
            expense: exp,
            income: inc,
            month: payload.month || targetRecord.month,
            record_type: recType,
            reconciled: payload.reconciled !== undefined ? payload.reconciled : targetRecord.reconciled
          }).eq('id', targetRecord.id);
        }
        
        return NextResponse.json({ success: true, message: body.action === 'delete_record' ? '削除しました。' : '更新しました。' });
      } else {
        return NextResponse.json({ error: 'レコードが見つかりません。' }, { status: 404 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
