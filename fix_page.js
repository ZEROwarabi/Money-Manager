const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

const missingBlock = `              </label>
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
`;

const anchor = `                <select value={editingRecordForm.category} onChange={e => setEditingRecordForm({...editingRecordForm, category: e.target.value})} required>
                  {uniqueCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                </select>`;

const cutPoint = `          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyData || []} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>`;

// Find the anchor
const startIdx = code.indexOf(anchor) + anchor.length;

// Find the start of the next section
const endIdx = code.indexOf('<div className="glass-card">', startIdx);

// Actually, wait, the file currently has:
//               </label>
//               <label>
//                 カテゴリ
//                 <select value={editingRecordForm.category} onChange={e => setEditingRecordForm({...editingRecordForm, category: e.target.value})} required>
//                   {uniqueCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}
//                 </select>
//           <div style={{ width: '100%', height: 350 }}>
//             <ResponsiveContainer>

// So we just replace from `anchor` to `</BarChart>\n            </ResponsiveContainer>\n          </div>\n        </div>` or whatever is left.

// Let's just do a regex replace to be safe.
code = code.replace(
  /\{\s*uniqueCategories\.map\(\(c: string\) => <option key=\{c\} value=\{c\}>\{c\}<\/option>\)\s*\}\n\s*<\/select>\n\s*<div style=\{\{ width: '100%', height: 350 \}\}>[\s\S]*?<\/BarChart>\n\s*<\/ResponsiveContainer>\n\s*<\/div>\n\s*<\/div>/,
  `{uniqueCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                </select>` + '\\n' + missingBlock
);

fs.writeFileSync('app/page.tsx', code);
console.log('Fixed page.tsx');
