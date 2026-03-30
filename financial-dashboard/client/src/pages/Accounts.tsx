import { useEffect, useState } from "react";
import { Plus, Trash2, Wallet, PiggyBank, CreditCard, TrendingUp, Bitcoin, MoreHorizontal } from "lucide-react";
import { accountsApi } from "../lib/api";
import Modal from "../components/Modal";
import CustomSelect, { SelectOption } from "../components/CustomSelect";
import { cn } from "../lib/utils";
import type { Account } from "../lib/types";

const accountTypeOptions: SelectOption[] = [
  { value: "bank", label: "Bank Account" },
  { value: "credit_card", label: "Credit Card" },
  { value: "investment", label: "Investment" },
  { value: "crypto", label: "Crypto Wallet" },
  { value: "paypal", label: "PayPal" },
  { value: "stripe", label: "Stripe" },
  { value: "cash", label: "Cash" },
  { value: "mobilepay", label: "MobilePay" },
  { value: "other", label: "Other" },
];

const currencyOptions: SelectOption[] = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "JPY", label: "JPY (¥)" },
  { value: "CAD", label: "CAD (C$)" },
  { value: "AUD", label: "AUD (A$)" },
];

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

const iconMap: Record<string, any> = {
  bank: Wallet,
  credit_card: CreditCard,
  investment: TrendingUp,
  crypto: Bitcoin,
  paypal: Wallet,
  stripe: CreditCard,
  cash: PiggyBank,
  mobilepay: Wallet,
  other: MoreHorizontal,
};

const colorMap: Record<string, string> = {
  bank: "bg-indigo-50",
  credit_card: "bg-amber-50",
  investment: "bg-emerald-50",
  crypto: "bg-sky-50",
  paypal: "bg-blue-50",
  stripe: "bg-violet-50",
  cash: "bg-green-50",
  mobilepay: "bg-cyan-50",
  other: "bg-slate-50",
};

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("bank");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [createdAt, setCreatedAt] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await accountsApi.getAll();
      setAccounts(res.data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await accountsApi.create({ name, type, initialBalance: parseFloat(balance) || 0, currency, createdAt });
      setIsModalOpen(false);
      setName(""); setType("bank"); setBalance(""); setCurrency("USD"); setCreatedAt(new Date().toISOString().split('T')[0]);
      fetchAccounts();
    } catch (error) {
      console.error("Error creating account:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await accountsApi.delete(id);
      fetchAccounts();
    } catch (error) {
      console.error("Error deleting account:", error);
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
          <h1 className="text-3xl font-bold text-slate-900">Accounts</h1>
          <p className="text-slate-500 mt-1">{accounts.length} account{accounts.length !== 1 ? 's' : ''} · {formatCurrency(totalBalance)} total</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No accounts yet</h3>
          <p className="text-slate-500 mb-4">Add your first account to get started</p>
          <button onClick={() => setIsModalOpen(true)} className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2.5 rounded-xl font-medium transition-colors">
            Add Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const Icon = iconMap[account.type] || Wallet;
            return (
              <div
                key={account.id}
                className={cn(
                  "p-6 rounded-2xl border border-slate-100 shadow-sm relative group transition-all hover:shadow-md",
                  colorMap[account.type] || "bg-slate-50"
                )}
              >
                <button onClick={() => handleDelete(account.id)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={18} />
                </button>
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-white p-3 rounded-xl shadow-sm text-slate-700">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-slate-900">{account.name}</h3>
                    <p className="text-sm text-slate-500 capitalize">{account.type.replace('_', ' ')}</p>
                  </div>
                </div>
                <div>
                  <span className="text-3xl font-serif font-bold text-slate-900">
                    {formatCurrency(account.balance, account.currency)}
                  </span>
                  <p className="text-sm text-slate-500 mt-1">{account.currency}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Account">
        <form className="space-y-4" onSubmit={handleCreate}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Account Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="e.g. Main Checking" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <CustomSelect 
              options={accountTypeOptions}
              value={type}
              onChange={(e) => setType(e as string)}
              placeholder="Select account type"
              maxHeight="max-h-48"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Initial Balance</label>
            <input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
            <CustomSelect 
              options={currencyOptions}
              value={currency}
              onChange={(e) => setCurrency(e as string)}
              placeholder="Select currency"
              maxHeight="max-h-48"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Account Created Date</label>
            <input type="date" value={createdAt} onChange={(e) => setCreatedAt(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white" />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors border border-slate-200">
              Cancel
            </button>
            <button type="submit" disabled={isSaving}
              className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50">
              {isSaving ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
