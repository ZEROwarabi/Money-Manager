const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

const missingBlock = `            </table>
          </div>
        </section>
      )}

      {/* Edit Record Modal */}
      {editingRecordIndex !== null && (
        <div className="modal-overlay" onClick={() => setEditingRecordIndex(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="chart-title">✏️ 記録の編集</h2>
            <form onSubmit={handleEditRecordSubmit} className="form-container">
              <label>日付 <input type="text" value={editingRecordForm.date} onChange={e => setEditingRecordForm({...editingRecordForm, date: e.target.value})} required /></label>
              <label>対象月 (YYYY-MM) <input type="text" value={editingRecordForm.month} onChange={e => setEditingRecordForm({...editingRecordForm, month: e.target.value})} required /></label>
              <label>
                処理タイプ
                <select value={editingRecordForm.recordType} onChange={e => setEditingRecordForm({...editingRecordForm, recordType: e.target.value})} required>
                  <option value="expense_normal">通常支出</option>
                  <option value="trip_sandbox">🎒 旅行・イベント一時プール（隔離保留）</option>
                  <option value="advance_payment">🤝 友人の立替（予算から除外）</option>
                  <option value="refund">↩️ 返金・キャンセル（予算復活）</option>
                  <option value="income_allowance">💰 入金（仕送り）</option>
                  <option value="income_special">💰 入金（特別資産・大型送金）</option>
                  <option value="advance_recovery">🤝 入金（立替の回収・清算）</option>
                </select>
              </label>
              <label>
                カテゴリ
                <select value={editingRecordForm.category} onChange={e => setEditingRecordForm({...editingRecordForm, category: e.target.value})} required>
                  {uniqueCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label>メモ / 品名 <input type="text" value={editingRecordForm.description} onChange={e => setEditingRecordForm({...editingRecordForm, description: e.target.value})} required /></label>
              <label>支出 ($) <input type="number" step="0.01" value={editingRecordForm.expense} onChange={e => setEditingRecordForm({...editingRecordForm, expense: e.target.value})} /></label>
              <label>収入 ($) <input type="number" step="0.01" value={editingRecordForm.income} onChange={e => setEditingRecordForm({...editingRecordForm, income: e.target.value})} /></label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                <button type="submit" className="action-button primary" style={{ flex: 1, background: '#F59E0B' }}>更新する</button>
                <button type="button" className="action-button secondary" onClick={() => setEditingRecordIndex(null)}>キャンセル</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="charts-grid" style={{ marginTop: '2rem' }}>
        <ExpensePieChart
          pieChartMonth={pieChartMonth}
          setPieChartMonth={setPieChartMonth}
          currentRealMonth={currentRealMonth}
          generatedPieData={generatedPieData}
          visibleExpenseData={visibleExpenseData}
          uniqueCategories={uniqueCategories}
          hiddenCategories={hiddenCategories}
          setHiddenCategories={setHiddenCategories}
        />

        <MonthlyBarChart 
          monthlyData={data?.monthlyData || []} 
          expenseData={data?.expenseData || []} 
        />
      </section>

      <div className="glass-card">
        <h2 className="chart-title">先月の振り返り ({lastMonthStr})</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>設定した全体予算</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{formatCurrency(lastMonthBudget)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>実際の支出</span>
`;

// Insert the missing code after </tbody> and before <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: lastMonthSpent > lastMonthBudget ? 'var(--warning-color)' : 'var(--success-color)' }}>
const anchor = `              </tbody>`;
const startIdx = code.indexOf(anchor) + anchor.length;

code = code.substring(0, startIdx) + '\n' + missingBlock + code.substring(startIdx);
fs.writeFileSync('app/page.tsx', code);
console.log('Fixed page.tsx using JS script perfectly.');
