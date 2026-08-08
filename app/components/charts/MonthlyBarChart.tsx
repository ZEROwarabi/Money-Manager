import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line } from 'recharts';
import { formatCurrency } from '../../lib/format';

const COLORS = ['#7dd3fc', '#38bdf8', '#86efac', '#34d399', '#f9a8d4', '#f472b6', '#a78bfa', '#c084fc'];

interface MonthlyBarChartProps {
  monthlyData: any[];
  expenseData: any[];
  monthlySettings?: Record<string, any>;
  onMonthClick?: (month: string) => void;
}

export const MonthlyBarChart = React.memo(({ monthlyData, expenseData, monthlySettings, onMonthClick }: MonthlyBarChartProps) => {
  const [hiddenBars, setHiddenBars] = useState<Record<string, boolean>>({ '収入': true, 'ホームステイ等、必要経費': true });

  const chartData = useMemo(() => {
    return monthlyData.map(d => {
      let budgetLimit = 0;
      if (monthlySettings && monthlySettings[d.name]) {
        monthlySettings[d.name].fixedExpenses.forEach((f: any) => {
          if (!hiddenBars[f.name]) {
            budgetLimit += (parseFloat(String(f.amount)) || 0);
          }
        });
      }
      return {
        ...d,
        budgetLimit: budgetLimit > 0 ? budgetLimit : null
      };
    });
  }, [monthlyData, monthlySettings, hiddenBars]);

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="chart-title" style={{ margin: 0 }}>
          月別推移 
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '10px', fontWeight: 'normal' }}>
            ※グラフをクリックして月を切り替え
          </span>
        </h2>
        <button 
          onClick={() => setHiddenBars({ '収入': true, 'ホームステイ等、必要経費': true })}
          style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 600 }}
        >
          🔄 デフォルト表示に戻す
        </button>
      </div>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <ComposedChart 
            data={chartData} 
            margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
            onClick={(e: any) => {
              if (e && e.activeLabel && onMonthClick) {
                onMonthClick(String(e.activeLabel));
              }
            }}
            style={{ cursor: onMonthClick ? 'pointer' : 'default' }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
            <XAxis 
              dataKey="name" 
              interval={0}
              tickLine={false} 
              axisLine={false} 
              tick={(props: any) => {
                const { x, y, payload } = props;
                if (payload.value === '不明') {
                  return <text x={x} y={y} dy={16} textAnchor="middle" fill="var(--text-secondary)" fontSize={12}>{payload.value}</text>;
                }
                const parts = payload.value.split('-');
                if (parts.length !== 2) return <text x={x} y={y} dy={16} textAnchor="middle" fill="var(--text-secondary)" fontSize={12}>{payload.value}</text>;
                
                const year = parts[0];
                const month = parseInt(parts[1], 10);
                
                const dataIndex = monthlyData.findIndex((d: any) => d.name === payload.value);
                const isFirstOfYear = dataIndex === 0 || (dataIndex > 0 && (monthlyData[dataIndex - 1]?.name || '').split('-')[0] !== year);

                return (
                  <g transform={`translate(${x},${y})`}>
                    <text x={0} y={0} dy={16} textAnchor="middle" fill="var(--text-primary)" fontSize={13}>
                      {month}月
                    </text>
                    {isFirstOfYear && (
                      <text x={0} y={0} dy={34} textAnchor="middle" fill="var(--text-secondary)" fontSize={11} fontWeight="bold">
                        {year}年
                      </text>
                    )}
                  </g>
                );
              }}
            />
            <YAxis tick={{ fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
            <Tooltip formatter={(value: any, name: any) => [formatCurrency(value || 0), name === 'budgetLimit' ? '表示項目の合計予算' : name]} />
            <Legend onClick={(e: any) => setHiddenBars(p => ({...p, [e.dataKey]: !p[e.dataKey]}))} wrapperStyle={{ cursor: 'pointer', paddingTop: '20px' }} verticalAlign="bottom" />
            <Bar dataKey="収入" hide={hiddenBars['収入']} fill="var(--success-color)" radius={[6, 6, 0, 0]} maxBarSize={50} />
            {expenseData.map((cat: any, i: number) => (
              <Bar 
                key={cat.name} 
                dataKey={cat.name} 
                stackId="expense" 
                fill={COLORS[i % COLORS.length]} 
                hide={hiddenBars[cat.name]} 
                maxBarSize={50}
              />
            ))}
            <Line type="monotone" dataKey="budgetLimit" name="表示項目の合計予算" stroke="#f97316" strokeWidth={2} dot={false} strokeDasharray="5 5" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
