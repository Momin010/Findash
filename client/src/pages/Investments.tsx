import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { investments } from "../data/mockData";
import Modal from "../components/Modal";
import { cn } from "../lib/utils";

export default function Investments() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Investments</h1>
          <p className="text-slate-500 mt-1">Track your portfolio performance</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add Investment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium">Portfolio Value</span>
            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
              <Activity size={20} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-serif font-bold text-slate-900">$48,373.5</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium">Total Gain/Loss</span>
            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-serif font-bold text-slate-900">$14,898.5</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium">Total Return</span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-serif font-bold text-slate-900">+44.51%</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 bg-slate-50/50">
                <th className="p-4 font-medium">Asset</th>
                <th className="p-4 font-medium">Shares</th>
                <th className="p-4 font-medium">Avg Cost</th>
                <th className="p-4 font-medium">Current</th>
                <th className="p-4 font-medium text-right">Gain/Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {investments.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-medium text-slate-900">{inv.asset}</p>
                    <p className="text-xs text-slate-500">{inv.symbol} Â· {inv.type}</p>
                  </td>
                  <td className="p-4 text-slate-700">{inv.shares}</td>
                  <td className="p-4 text-slate-700">${inv.avgCost.toLocaleString()}</td>
                  <td className="p-4 text-slate-700">${inv.current.toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <div className={cn(
                      "font-medium",
                      inv.gainLoss >= 0 ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {inv.gainLoss >= 0 ? '+' : ''}${inv.gainLoss.toLocaleString()}
                    </div>
                    <div className={cn(
                      "text-xs",
                      inv.gainLossPct >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {inv.gainLossPct >= 0 ? '+' : ''}{inv.gainLossPct}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Investment">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Asset Name</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="e.g. Apple Inc."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Symbol</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase"
                placeholder="AAPL"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white">
                <option value="Stocks">Stocks</option>
                <option value="ETF">ETF</option>
                <option value="Crypto">Crypto</option>
                <option value="Mutual Fund">Mutual Fund</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Shares</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Average Cost</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="0.00"
              />
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
