import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceLine, Bar } from 'recharts';
import { formatCurrency } from '../../lib/format';

const COLORS = ['#7dd3fc', '#38bdf8', '#86efac', '#34d399', '#f9a8d4', '#f472b6', '#a78bfa', '#c084fc'];

interface MonthlyBarChartProps {
  monthlyData: any[];
  expenseData: any[];
  onMonthClick?: (month: string) => void;
}

export const MonthlyBarChart = React.memo(({ monthlyData, expenseData, onMonthClick }: MonthlyBarChartProps) => {
  const [hiddenBars, setHiddenBars] = useState<Record<string, boolean>>({ '収入': true, 'ホームステイ等、必要経費': true });

  return (
    <div className="glass-card">
      <h2 className="chart-title">
        月別推移 
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '10px', fontWeight: 'normal' }}>
          ※グラフをクリックして月を切り替え
        </span>
      </h2>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <BarChart 
            data={monthlyData} 
            margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
            onClick={(e) => {
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
            <Tooltip formatter={(value: any) => formatCurrency(value || 0)} />
            <Legend onClick={(e: any) => setHiddenBars(p => ({...p, [e.dataKey]: !p[e.dataKey]}))} wrapperStyle={{ cursor: 'pointer' }} verticalAlign="top" />
            <ReferenceLine y={2000} stroke="#f97316" strokeDasharray="3 3" opacity={0.5} label={{ position: 'insideTopLeft', value: '全体予算 ($2000)', fill: '#f97316', fontSize: 12, opacity: 0.8 }} />
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
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
