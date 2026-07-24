const fs = require('fs');
fs.mkdirSync('app/components/modals', { recursive: true });

let code = fs.readFileSync('app/page.tsx', 'utf8');
const lines = code.split('\n');

const startIndex = lines.findIndex(l => l.includes('{/* CSV Reconcile Modal */}'));
let endIndex = -1;
let openBrackets = 0;

for (let i = startIndex + 1; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('(')) openBrackets += (line.match(/\(/g) || []).length;
  if (line.includes(')')) openBrackets -= (line.match(/\)/g) || []).length;
  
  if (openBrackets === 0 && i > startIndex + 10) {
    endIndex = i;
    break;
  }
}

if (startIndex !== -1 && endIndex !== -1) {
    const modalJSX = lines.slice(startIndex, endIndex + 1).join('\n');
    const modalCode = `import React, { useState } from 'react';
import { Transaction, AppData } from '../../types';
import { formatCurrency } from '../../lib/format';
import { autoReconcile } from '../../lib/reconcile';

interface CsvReconcileModalProps {
  onClose: () => void;
  data: AppData | null;
  csvRecords: Transaction[];
  setCsvRecords: React.Dispatch<React.SetStateAction<Transaction[]>>;
  fetchData: () => void;
}

export const CsvReconcileModal: React.FC<CsvReconcileModalProps> = ({ onClose, data, csvRecords, setCsvRecords, fetchData }) => {
  const [bankBalanceInput, setBankBalanceInput] = useState<string>('');
  const [selectedCsvIndices, setSelectedCsvIndices] = useState<Set<number>>(new Set());
  const [selectedAppIndices, setSelectedAppIndices] = useState<Set<number>>(new Set());

  // Extracted inline code from JSX
  const autoReconcileBtn = () => {
    const res = autoReconcile(csvRecords, data?.records || []);
    setSelectedCsvIndices(res.matchedBankIndices);
    setSelectedAppIndices(res.matchedAppIndices);
  };

  const parsedBank = parseFloat(String(bankBalanceInput));
  const calculatedBankBalance = (isNaN(parsedBank) ? 0 : parsedBank) + Array.from(selectedCsvIndices).reduce((sum, idx) => sum + ((csvRecords[idx]?.expense || 0) - (csvRecords[idx]?.income || 0)), 0);

  const csvTotal = Array.from(selectedCsvIndices).reduce((sum, idx) => sum + ((csvRecords[idx]?.expense || 0) - (csvRecords[idx]?.income || 0)), 0);
  const appTotal = Array.from(selectedAppIndices).reduce((sum, idx) => {
    const r = (data?.records || []).find(x => x.originalIndex === idx);
    return sum + ((r?.expense || 0) - (r?.income || 0));
  }, 0);
  const diff = Math.round((csvTotal - appTotal) * 100) / 100;
  const isMatch = Math.abs(diff) < 0.01;

  // We need to keep the original handleReconcile logic inside here
  // But wait, the original modal JSX has handleReconcile already defined inside its JSX body?!
  // I will just return the modal JSX, but without the {showCsvModal && ( )} wrapper.

  return (
    <>
      ${modalJSX.replace(/\{showCsvModal && \(/g, '').replace(/\)\}/g, '').trim()}
    </>
  );
};
`;

    // Wait, the original modal JSX has the `showCsvModal && (` wrapper. We need to strip that properly.
    // Also `handleReconcile` is defined inside.
}
