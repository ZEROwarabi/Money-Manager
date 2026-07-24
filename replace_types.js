const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

if (!code.includes('import { Transaction, AppData, WishlistItem }')) {
  code = code.replace(
    "import React, { useState, useEffect, useRef } from 'react';",
    "import React, { useState, useEffect, useRef } from 'react';\nimport { Transaction, AppData, WishlistItem, RecordType } from './types';"
  );
}

// Global replaces
code = code.replace(/useState<any>\(null\)/g, 'useState<AppData | null>(null)');
code = code.replace(/useState<any>\(\{\}\)/g, 'useState<Record<string, any>>({})'); 
code = code.replace(/const \[csvRecords, setCsvRecords\] = useState<any\[\]>\(\[\]\);/g, 'const [csvRecords, setCsvRecords] = useState<Transaction[]>([]);');
code = code.replace(/const \[localWishlist, setLocalWishlist\] = useState<any\[\]>\(\[\]\);/g, 'const [localWishlist, setLocalWishlist] = useState<WishlistItem[]>([]);');

// Other specific replaces
code = code.replace(/candidates: any\[\]/g, 'candidates: Transaction[]');
code = code.replace(/subset: any\[\]/g, 'subset: Transaction[]');
code = code.replace(/bankRecords: any\[\]/g, 'bankRecords: Transaction[]');
code = code.replace(/reconciledRecords: any\[\]/g, 'reconciledRecords: Transaction[]');
code = code.replace(/appRecords: any\[\]/g, 'appRecords: Transaction[]');
code = code.replace(/unmatchedCandidates: any\[\]/g, 'unmatchedCandidates: Transaction[]');
code = code.replace(/currentCombination: any\[\]/g, 'currentCombination: Transaction[]');
code = code.replace(/results: any\[\]\[\]/g, 'results: Transaction[][]');
code = code.replace(/let newRecords: any\[\] = \[\];/g, 'let newRecords: Transaction[] = [];');
code = code.replace(/const handleBuyWishlist = \(w: any\) =>/g, 'const handleBuyWishlist = (w: WishlistItem) =>');

// Maps and filters
code = code.replace(/\(r: any, originalIndex: number\)/g, '(r: Transaction, originalIndex: number)');
code = code.replace(/\.filter\(\(r: any\) =>/g, '.filter((r: Transaction) =>');
code = code.replace(/\.map\(\(r: any\) =>/g, '.map((r: Transaction) =>');
code = code.replace(/bankRecords\.filter\(\(_: any, idx: number\)/g, 'bankRecords.filter((_: Transaction, idx: number)');

fs.writeFileSync('app/page.tsx', code);
console.log('Replaced types in page.tsx');
