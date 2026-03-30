import { useState } from "react";
import { Plus, Trash2, Wallet, PiggyBank, CreditCard, TrendingUp } from "lucide-react";
import { accounts } from "../data/mockData";
import Modal from "../components/Modal";
import { cn } from "../lib/utils";

const iconMap: Record<string, any> = {
  "Checking": Wallet,
  "Savings": PiggyBank,
  "Credit Card": CreditCard,
  "Investment": TrendingUp,
};

export default function Accounts() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Accounts</h1>
          <p className="text-slate-500 mt-1">4 accounts Â· $51,090.25 total</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => {
          const Icon = iconMap[account.type] || Wallet;
          return (
            <div
              key={account.id}
              className={cn(
                "p-6 rounded-2xl border border-slate-100 shadow-sm relative group transition-all hover:shadow-md",
                account.color
              )}
            >
              <button className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={18} />
              </button>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-white p-3 rounded-xl shadow-sm text-slate-700">
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-slate-900">{account.name}</h3>
                  <p className="text-sm text-slate-500">{account.type}</p>
                </div>
              </div>
              <div>
                <span className="text-3xl font-serif font-bold text-slate-900">
                  {account.balance < 0 ? `-$${Math.abs(account.balance).toLocaleString()}` : `$${account.balance.toLocaleString()}`}
                </span>
                <p className="text-sm text-slate-500 mt-1">{account.institution}</p>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Account">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Account Name</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="e.g. Main Checking"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white">
              <option value="">Select type</option>
              <option value="Checking">Checking</option>
              <option value="Savings">Savings</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Investment">Investment</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Balance</label>
            <input
              type="number"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Institution</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="e.g. Chase Bank"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
            <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
            >
              Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
