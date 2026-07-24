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
`;

// we want to replace EVERYTHING from `</select>\n          <div style={{ width: '100%', height: 350 }}>`
// down to `              </BarChart>\n            </ResponsiveContainer>\n          </div>\n        </div>`

const startAnchor = `                </select>`;
const endAnchor = `              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>`;

const startIdx = code.indexOf(startAnchor);
const endIdx = code.indexOf(endAnchor);

if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx + startAnchor.length) + "\n" + missingBlock + code.substring(endIdx + endAnchor.length);
  fs.writeFileSync('app/page.tsx', code);
  console.log('Fixed page.tsx');
} else {
  console.log('Could not find anchors');
}
