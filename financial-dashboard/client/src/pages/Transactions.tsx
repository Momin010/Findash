import { useEffect, useState } from "react";
import { Plus, Search, Trash2, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { transactionsApi, categoriesApi, accountsApi } from "../lib/api";
import Modal from "../components/Modal";
import CustomSelect, { SelectOption } from "../components/CustomSelect";
import { cn } from "../lib/utils";
import type { Transaction, Category, Account } from "../lib/types";

const transactionTypeOptions: SelectOption[] = [
  { value: "", label: "All Types" },
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfer" },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateStr: string) {
  if (!dateStr) return 'No date';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");

  // Form state
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [txType, setTxType] = useState("expense");
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [txRes, catRes, accRes] = await Promise.all([
        transactionsApi.getAll(),
        categoriesApi.getAll(),
        accountsApi.getAll(),
      ]);
      setTransactions(txRes.data || []);
      setCategories(catRes.data || []);
      setAccounts(accRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType ? t.transactionType === filterType : true;
    return matchesSearch && matchesType;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return;
    setIsSaving(true);
    try {
      await transactionsApi.create({
        accountId,
        categoryId: categoryId || undefined,
        description,
        amount: parseFloat(amount),
        transactionDate: date,
        transactionType: txType,
      });
      setIsModalOpen(false);
      setDescription(""); setAmount(""); setCategoryId(""); setAccountId(""); setTxType("expense");
      setDate(new Date().toISOString().split('T')[0]);
      fetchData();
    } catch (error) {
      console.error("Error creating transaction:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await transactionsApi.delete(id);
      fetchData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4f46e5]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-500 mt-1">{transactions.length} total transaction{transactions.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setIsModalOpen(true)}
          className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus size={18} /> Add Transaction
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Search transactions..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
          </div>
          <CustomSelect
            options={transactionTypeOptions}
            value={filterType}
            onChange={(value) => setFilterType(value as string)}
            placeholder="All Types"
            className="w-40"
          />
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">No transactions found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={cn("p-2 rounded-xl",
                    tx.transactionType === 'expense' ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                  )}>
                    {tx.transactionType === 'expense' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{tx.description}</p>
                    <p className="text-sm text-slate-500">
                      {tx.category?.name || 'Uncategorized'} · {tx.account?.name || 'Unknown'} · {formatDate(tx.transactionDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn("font-serif font-bold",
                    tx.transactionType === 'expense' ? "text-slate-900" : "text-emerald-600"
                  )}>
                    {tx.transactionType === 'expense' ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
                  </span>
                  <button onClick={() => handleDelete(tx.id)}
                    className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Transaction">
        <form className="space-y-4" onSubmit={handleCreate}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="e.g. Grocery Run" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Account</label>
            <CustomSelect
              options={accounts.map(a => ({ value: a.id, label: a.name }))}
              value={accountId}
              onChange={(value) => setAccountId(value as string)}
              placeholder="Select account"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <CustomSelect
              options={[{ value: "", label: "Select category" }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
              value={categoryId}
              onChange={(value) => setCategoryId(value as string)}
              placeholder="Select category"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <div className="flex gap-4">
              {[['expense','Expense'],['income','Income'],['transfer','Transfer']].map(([val, label]) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="type" value={val} checked={txType === val}
                    onChange={(e) => setTxType(e.target.value)} className="text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors border border-slate-200">Cancel</button>
            <button type="submit" disabled={isSaving}
              className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50">
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
