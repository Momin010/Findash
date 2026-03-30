import { useState } from "react";
import { Plus, Search, Trash2, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { transactions } from "../data/mockData";
import Modal from "../components/Modal";
import { cn } from "../lib/utils";

export default function Transactions() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTransactions = transactions.filter(tx => 
    tx.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-500 mt-1">20 total transactions</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add Transaction
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex gap-4">
            <select className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white text-slate-700">
              <option value="">All Types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <select className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white text-slate-700">
              <option value="">All Categories</option>
              <option value="food">Food & Dining</option>
              <option value="transport">Transport</option>
              <option value="shopping">Shopping</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {filteredTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-2 rounded-xl",
                  tx.type === 'expense' ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                )}>
                  {tx.type === 'expense' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{tx.name}</p>
                  <p className="text-sm text-slate-500">{tx.category} Â· {tx.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={cn(
                  "font-serif font-bold",
                  tx.type === 'expense' ? "text-slate-900" : "text-emerald-600"
                )}>
                  {tx.type === 'expense' ? `-$${Math.abs(tx.amount)}` : `+$${tx.amount}`}
                </span>
                <button className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Transaction">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="e.g. Grocery Run"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
              <input
                type="number"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white">
              <option value="">Select category</option>
              <option value="food">Food & Dining</option>
              <option value="transport">Transport</option>
              <option value="shopping">Shopping</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="type" value="expense" defaultChecked className="text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-slate-700">Expense</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="type" value="income" className="text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-slate-700">Income</span>
              </label>
            </div>
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
