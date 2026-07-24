const fs = require('fs');

let pageCode = fs.readFileSync('app/page.tsx', 'utf8');

// 1. Add import
if (!pageCode.includes('import { useFinanceData }')) {
  pageCode = pageCode.replace(
    "import { formatCurrency } from './lib/format';",
    "import { formatCurrency } from './lib/format';\nimport { useFinanceData } from './hooks/useFinanceData';"
  );
}

// 2. Remove state and add hook destructuring
const stateToRemove = [
  "const [loading, setLoading] = useState(true);",
  "const [error, setError] = useState('');",
  "const [data, setData] = useState<AppData | null>(null);",
  "const [monthlySettings, setMonthlySettings] = useState<Record<string, MonthlySettings>>({});",
  "const [localWishlist, setLocalWishlist] = useState<WishlistItem[]>([]);",
  "const [ignoredBudgetCategories, setIgnoredBudgetCategories] = useState<string[]>([]);"
];

for (const s of stateToRemove) {
  pageCode = pageCode.replace(s, "");
}

if (!pageCode.includes('const { data, loading, error,')) {
  pageCode = pageCode.replace(
    "export default function Dashboard() {",
    "export default function Dashboard() {\n  const { data, loading, error, monthlySettings, localWishlist, setLocalWishlist, ignoredBudgetCategories, fetchData, addWishlist, toggleWishlist, deleteWishlist, updateWishlist, toggleIgnoredBudgetCategory, editRecord, deleteRecord, autoCoverTransportation, exportData, importData } = useFinanceData();"
  );
}

// 3. Remove fetchData body
const fetchDataStart = pageCode.indexOf('  const fetchData = () => {');
if (fetchDataStart !== -1) {
  let end = -1;
  let openBrackets = 0;
  for (let i = fetchDataStart; i < pageCode.length; i++) {
    if (pageCode[i] === '{') openBrackets++;
    if (pageCode[i] === '}') {
      openBrackets--;
      if (openBrackets === 0) {
        end = i;
        break;
      }
    }
  }
  if (end !== -1) {
    pageCode = pageCode.substring(0, fetchDataStart) + 
      "  useEffect(() => {\n    if (data?.expenseData && data.expenseData.length > 0 && !expenseForm.category) {\n      setExpenseForm(prev => ({ ...prev, category: data.expenseData![0].name }));\n    }\n  }, [data?.expenseData, expenseForm.category]);\n" + 
      pageCode.substring(end + 1);
  }
}

// 4. Update wrappers
const replacements = [
  {
    regex: /const handleAddWishlist = async \([^)]*\) => {[\s\S]*?catch \(err\) {[\s\S]*?}[\s\S]*?};/,
    replacement: `const handleAddWishlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishlistForm.name || !wishlistForm.amount || !wishlistForm.category) return;
    try {
      await addWishlist({ name: wishlistForm.name, amount: wishlistForm.amount, category: wishlistForm.category, id: Date.now().toString() });
      setWishlistForm({ name: '', amount: '', category: '' });
    } catch (err) {
      console.error(err);
    }
  };`
  },
  {
    regex: /const handleToggleWishlist = async \([^)]*\) => {[\s\S]*?catch \(err\) {[\s\S]*?}[\s\S]*?};/,
    replacement: `const handleToggleWishlist = async (id: string, isApplied: boolean) => {
    setLocalWishlist(prev => prev.map(w => w.id === id ? { ...w, isApplied } : w));
    try {
      await toggleWishlist(id, isApplied);
    } catch (err) {
      console.error(err);
    }
  };`
  },
  {
    regex: /const handleDeleteWishlist = async \([^)]*\) => {[\s\S]*?catch \(err\) {[\s\S]*?}[\s\S]*?};/,
    replacement: `const handleDeleteWishlist = async (id: string) => {
    try {
      await deleteWishlist(id);
    } catch (err) {
      console.error(err);
    }
  };`
  },
  {
    regex: /const handleUpdateWishlist = async \([^)]*\) => {[\s\S]*?catch \(err\) {[\s\S]*?}[\s\S]*?};/,
    replacement: `const handleUpdateWishlist = async (id: string) => {
    try {
      await updateWishlist(id, editingWishlistForm);
      setEditingWishlistId(null);
    } catch (err) {
      console.error(err);
    }
  };`
  },
  {
    regex: /const handleToggleIgnoredBudgetCategory = async \([^)]*\) => {[\s\S]*?catch \(err\) {[\s\S]*?}[\s\S]*?};/,
    replacement: `const handleToggleIgnoredBudgetCategory = async (category: string, isIgnored: boolean) => {
    try {
      await toggleIgnoredBudgetCategory(category, isIgnored);
    } catch (err) {
      console.error(err);
    }
  };`
  },
  {
    regex: /const handleEditRecordSubmit = async \([^)]*\) => {[\s\S]*?catch \(err\) {[\s\S]*?}[\s\S]*?};/,
    replacement: `const handleEditRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecordIndex === null) return;
    try {
      await editRecord(editingRecordIndex, editingRecordForm);
      alert('編集内容を保存しました！');
      setEditingRecordIndex(null);
    } catch (err) {
      alert('エラーが発生しました');
    }
  };`
  },
  {
    regex: /const handleDeleteRecord = async \([^)]*\) => {[\s\S]*?catch \(err\) {[\s\S]*?}[\s\S]*?};/,
    replacement: `const handleDeleteRecord = async (index: number) => {
    try {
      await deleteRecord(index);
      setConfirmDeleteIndex(null);
    } catch (err) {
      alert('エラーが発生しました');
    }
  };`
  },
  {
    regex: /const handleAutoCoverTransportation = async \([^)]*\) => {[\s\S]*?catch \(e\) {[\s\S]*?}[\s\S]*?}/,
    replacement: `const handleAutoCoverTransportation = async (neededAmount: number) => {
    try {
      const transfers = await autoCoverTransportation(neededAmount, currentRealMonth);
      if (transfers.length > 0) alert('交通費の自動補填が完了しました！');
    } catch (e: any) {
      alert(e.message || 'エラーが発生しました。');
    }
  };`
  },
  {
    regex: /const handleExportData = async \([^)]*\) => {[\s\S]*?catch \(err\) {[\s\S]*?}[\s\S]*?};/,
    replacement: `const handleExportData = async () => {
    try {
      await exportData();
    } catch (err: any) {
      alert(err.message || 'バックアップの作成に失敗しました。');
      console.error(err);
    }
  };`
  }
];

for (const rep of replacements) {
  pageCode = pageCode.replace(rep.regex, rep.replacement);
}

// 5. Fix importData
const importStart = pageCode.indexOf('const handleImportData');
if (importStart !== -1) {
  let end = -1;
  let openBrackets = 0;
  for (let i = importStart; i < pageCode.length; i++) {
    if (pageCode[i] === '{') openBrackets++;
    if (pageCode[i] === '}') {
      openBrackets--;
      if (openBrackets === 0) {
        end = i;
        break;
      }
    }
  }
  if (end !== -1) {
    pageCode = pageCode.substring(0, importStart) + 
      `const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importData(file);
      alert('データを復元しました。');
    } catch (err: any) {
      alert(err.message || 'リストアに失敗しました。');
      console.error(err);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };` + 
      pageCode.substring(end + 1);
  }
}

fs.writeFileSync('app/page.tsx', pageCode);
console.log('Successfully updated page.tsx with useFinanceData wrappers');
