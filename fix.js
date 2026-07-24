const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

const newTbody = `              <tbody>
                {data.records.map((r, i) => ({ ...r, originalIndex: i })).filter((r) => r.date && r.date.trim() !== '').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map((record, idx) => {
                  const originalIndex = record.originalIndex;
                  const isIncome = record.recordType === 'income_allowance' || record.recordType === 'income_special' || record.recordType === 'advance_recovery';
                  const amount = isIncome ? record.income : record.expense;
                  return (
                    <tr key={originalIndex} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                      <td style={{ padding: '0.8rem' }}>{record.date}</td>
                      <td style={{ padding: '0.8rem', fontWeight: 500 }}>{record.description}</td>
                      <td style={{ padding: '0.8rem' }}>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                          {record.category}
                        </span>
                      </td>
                      <td style={{ padding: '0.8rem', textAlign: 'right', fontWeight: 'bold', color: isIncome ? '#059669' : '#e11d48' }}>
                        {isIncome ? '+' : '-'}{formatCurrency(amount)}
                      </td>
                      <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                          {record.recordType === 'advance_payment' && !record.isRecovered && (
                            confirmRecoveryIndex === originalIndex ? (
                              <button 
                                onClick={async () => {
                                  setConfirmRecoveryIndex(null);
                                  const payload = {
                                    date: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
                                    category: '入金',
                                    description: \\\`\\\${record.description} (立替回収)\\\`,
                                    amount: amount,
                                    recordType: 'advance_recovery'
                                  };
                                  await fetch('/api/finance', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'add_expense', payload })
                                  });
                                  await fetch('/api/finance', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'edit_record', payload: { index: originalIndex, ...record, isRecovered: true } })
                                  });
                                  fetchData();
                                }}
                                className="action-button secondary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', background: '#16a34a', color: 'white', borderColor: '#16a34a', whiteSpace: 'nowrap' }}
                              >
                                回収する
                              </button>
                            ) : (
                              <button 
                                onClick={() => setConfirmRecoveryIndex(originalIndex)}
                                className="action-button secondary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', background: '#dcfce3', color: '#166534', borderColor: '#bbf7d0', whiteSpace: 'nowrap' }}
                              >
                                ✓ 回収
                              </button>
                            )
                          )}
                          <button 
                            onClick={() => {
                              setEditingRecordIndex(originalIndex);
                              setEditingRecordForm({
                                date: record.date || '',
                                category: record.category || '',
                                description: record.description || '',
                                expense: record.expense || '',
                                income: record.income || '',
                                month: record.month || '',
                                recordType: record.recordType || 'expense_normal'
                              });
                            }}
                            className="action-button secondary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                          >
                            ✏️
                          </button>
                          {confirmDeleteIndex === originalIndex ? (
                            <button 
                              onClick={() => {
                                handleDeleteRecord(originalIndex);
                                setConfirmDeleteIndex(null);
                              }}
                              className="action-button secondary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', background: '#e11d48', color: 'white', borderColor: '#e11d48' }}
                            >
                              削除する
                            </button>
                          ) : (
                            <button 
                              onClick={() => setConfirmDeleteIndex(originalIndex)}
                              className="action-button secondary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', background: '#ffe4e6', color: '#e11d48', borderColor: '#fecdd3' }}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }).reverse()}
              </tbody>`;

const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('<tbody>'));
const end = lines.findIndex(l => l.includes('</tbody>'));
lines.splice(start, end - start + 1, newTbody);
fs.writeFileSync('app/page.tsx', lines.join('\n'));
