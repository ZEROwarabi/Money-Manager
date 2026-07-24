const fs = require('fs');
fs.mkdirSync('app/lib', { recursive: true });

let code = fs.readFileSync('app/page.tsx', 'utf8');

const startIdx = code.indexOf('// 1. 金額を整数（最小通貨単位）に変換するユーティリティ');
const endIdx = code.indexOf('export default function Dashboard() {');

if (startIdx !== -1 && endIdx !== -1) {
    const extracted = code.substring(startIdx, endIdx);
    let reconcileCode = "import { Transaction } from '../types';\n\n" + extracted;
    
    // Add exports
    reconcileCode = reconcileCode.replace(/const toCents =/g, 'export const toCents =');
    reconcileCode = reconcileCode.replace(/const calculateConfidence =/g, 'export const calculateConfidence =');
    reconcileCode = reconcileCode.replace(/const findSubsetSum =/g, 'export const findSubsetSum =');
    reconcileCode = reconcileCode.replace(/const matchOneToMany =/g, 'export const matchOneToMany =');
    reconcileCode = reconcileCode.replace(/function deduplicateBankRecords/g, 'export function deduplicateBankRecords');
    reconcileCode = reconcileCode.replace(/function autoReconcile/g, 'export function autoReconcile');
    
    // Add phase 6-2 improvement
    reconcileCode = reconcileCode.replace(
      /const targetCents = toCents\(targetAmount\);/,
      'const targetCents = toCents(targetAmount);\n  if (targetCents === 0) return []; // 金額0のマッチングは無意味なのでスキップ'
    );

    fs.writeFileSync('app/lib/reconcile.ts', reconcileCode);
    
    // Remove from page.tsx and add import
    const newCode = code.substring(0, startIdx) + 
      "import { toCents, calculateConfidence, findSubsetSum, matchOneToMany, deduplicateBankRecords, autoReconcile } from './lib/reconcile';\n\n" + 
      code.substring(endIdx);
      
    fs.writeFileSync('app/page.tsx', newCode);
    console.log('Successfully extracted reconcile.ts');
} else {
    console.log('Failed to find boundaries');
}
