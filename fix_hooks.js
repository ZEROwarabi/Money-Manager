const fs = require('fs');

let code = fs.readFileSync('app/page.tsx', 'utf8');

const earlyReturnsBlock = `  if (!mounted) return null;

  if (loading && !data) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="stat-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>データを読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="dashboard-container">
        <div className="glass-card" style={{ borderColor: 'var(--warning-color)' }}>
          <h2 className="chart-title" style={{ color: 'var(--warning-color)' }}>エラーが発生しました</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;`;

// 1. Remove the early returns from their original location
code = code.replace(earlyReturnsBlock, '');

// 2. Change the destructuring of data so it won't crash if data is null
code = code.replace(
  /const \{ summary, expenseData: originalExpenseData, monthlyData, accountBalances \} = data;/g,
  `const summary = data?.summary || {};\n  const originalExpenseData = data?.expenseData || [];\n  const monthlyData = data?.monthlyData || [];\n  const accountBalances = data?.accountBalances || [];`
);

// 3. Find the main return statement and insert the early returns right above it.
code = code.replace(
  /(\s*)(return \(\s*<div className="dashboard">)/,
  `$1${earlyReturnsBlock}\n$1$2`
);

fs.writeFileSync('app/page.tsx', code);
console.log('Fixed hooks rules in page.tsx');
