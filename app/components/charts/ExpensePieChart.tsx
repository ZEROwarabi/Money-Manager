import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '../../lib/format';

const COLORS = ['#7dd3fc', '#38bdf8', '#86efac', '#34d399', '#f9a8d4', '#f472b6', '#a78bfa', '#c084fc'];

interface ExpensePieChartProps {
  selectedMonth: string;
  currentRealMonth: string;
  generatedPieData: any[];
  visibleExpenseData: any[];
  uniqueCategories: string[];
  hiddenCategories: Record<string, boolean>;
  setHiddenCategories: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const ExpensePieChart = React.memo(({
  selectedMonth,
  currentRealMonth,
  generatedPieData,
  visibleExpenseData,
  uniqueCategories,
  hiddenCategories,
  setHiddenCategories
}: ExpensePieChartProps) => {
  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="chart-title" style={{ margin: 0 }}>
          支出の割合（カテゴリ別）
          {selectedMonth && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '10px', fontWeight: 'normal' }}>
            ※{selectedMonth === currentRealMonth ? '今月' : selectedMonth}のデータ
          </span>}
        </h2>
      </div>
      <div style={{ width: '100%', height: 350 }}>
        {generatedPieData.length > 0 ? (
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={visibleExpenseData}
                cx="50%" cy="45%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value"
              >
                {visibleExpenseData.map((entry: any, index: number) => {
                  const originalIndex = uniqueCategories.findIndex((name: string) => name === entry.name);
                  return <Cell key={`cell-${index}`} fill={COLORS[Math.max(0, originalIndex) % COLORS.length]} />;
                })}
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(value || 0)} />
              <Legend 
                 content={() => (
                   <ul style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', padding: 0, listStyle: 'none' }}>
                     {generatedPieData.map((entry: any, index: number) => {
                       const originalIndex = uniqueCategories.findIndex((name: string) => name === entry.name);
                       return (
                         <li key={`item-${index}`} onClick={() => setHiddenCategories(p => ({...p, [entry.name]: !p[entry.name]}))}
                             style={{ cursor: 'pointer', opacity: hiddenCategories[entry.name] ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '5px' }}>
                           <div style={{ width: 12, height: 12, backgroundColor: COLORS[Math.max(0, originalIndex) % COLORS.length], borderRadius: '50%' }}></div>
                           <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{entry.name}</span>
                         </li>
                       );
                     })}
                   </ul>
                 )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : <p style={{textAlign: 'center', marginTop: '100px'}}>データがありません</p>}
      </div>
    </div>
  );
});
