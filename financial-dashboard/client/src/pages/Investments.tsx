import { useEffect, useState } from "react";
import { Plus, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { investmentsApi } from "../lib/api";
import Modal from "../components/Modal";
import { cn } from "../lib/utils";
import type { Investment } from "../lib/types";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatPercentage(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export default function Investments() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [assetType, setAssetType] = useState("stock");
  const [quantity, setQuantity] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchInvestments = async () => {
    try {
      const res = await investmentsApi.getAll();
      setInvestments(res.data || []);
    } catch (error) {
      console.error("Error fetching investments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchInvestments(); }, []);

  const totalValue = investments.reduce((sum, inv) => sum + (inv.marketValue || 0), 0);
  const totalCost = investments.reduce((sum, inv) => sum + (inv.avgCostBasis * inv.quantity), 0);
  const totalGainLoss = totalValue - totalCost;
  const totalReturn = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await investmentsApi.create({
        name,
        symbol: symbol.toUpperCase(),
        assetType,
        quantity: parseFloat(quantity),
        avgCostBasis: parseFloat(avgCost) || 0,
        currentPrice: currentPrice ? parseFloat(currentPrice) : undefined,
      });
      setIsModalOpen(false);
      setName(""); setSymbol(""); setAssetType("stock"); setQuantity(""); setAvgCost(""); setCurrentPrice("");
      fetchInvestments();
    } catch (error) {
      console.error("Error creating investment:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await investmentsApi.delete(id);
      fetchInvestments();
    } catch (error) {
      console.error("Error deleting investment:", error);
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
          <h1 className="text-3xl font-bold text-slate-900">Investments</h1>
          <p className="text-slate-500 mt-1">Track your portfolio performance</p>
        </div>
        <button onClick={() => setIsModalOpen(true)}
          className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus size={18} /> Add Investment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium">Portfolio Value</span>
            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><Activity size={20} /></div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-serif font-bold text-slate-900">{formatCurrency(totalValue)}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium">Total Gain/Loss</span>
            <div className={cn("p-2 rounded-lg", totalGainLoss >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
              {totalGainLoss >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
          </div>
          <div className="mt-4">
            <span className={cn("text-3xl font-serif font-bold", totalGainLoss >= 0 ? "text-emerald-600" : "text-rose-600")}>
              {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)}
            </span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium">Total Return</span>
          </div>
          <div className="mt-4">
            <span className={cn("text-3xl font-serif font-bold", totalReturn >= 0 ? "text-emerald-600" : "text-rose-600")}>
              {formatPercentage(totalReturn)}
            </span>
          </div>
        </div>
      </div>

      {investments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <h3 className="text-lg font-medium text-slate-900 mb-2">No investments yet</h3>
          <p className="text-slate-500 mb-4">Add your first investment to track your portfolio</p>
          <button onClick={() => setIsModalOpen(true)}
            className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2.5 rounded-xl font-medium transition-colors">
            Add Investment
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 bg-slate-50/50">
                  <th className="p-4 font-medium">Asset</th>
                  <th className="p-4 font-medium">Quantity</th>
                  <th className="p-4 font-medium">Avg Cost</th>
                  <th className="p-4 font-medium">Current</th>
                  <th className="p-4 font-medium text-right">Gain/Loss</th>
                  <th className="p-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {investments.map((inv) => {
                  const gainLoss = inv.unrealizedGainLoss || 0;
                  const returnPct = inv.returnPercentage || 0;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <p className="font-medium text-slate-900">{inv.name}</p>
                        <p className="text-xs text-slate-500">{inv.symbol} · {inv.assetType.replace('_', ' ')}</p>
                      </td>
                      <td className="p-4 text-slate-700">{inv.quantity}</td>
                      <td className="p-4 text-slate-700">{formatCurrency(inv.avgCostBasis)}</td>
                      <td className="p-4 text-slate-700">{inv.currentPrice ? formatCurrency(inv.currentPrice) : 'N/A'}</td>
                      <td className="p-4 text-right">
                        <div className={cn("font-medium", gainLoss >= 0 ? "text-emerald-600" : "text-rose-600")}>
                          {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)}
                        </div>
                        <div className={cn("text-xs", returnPct >= 0 ? "text-emerald-500" : "text-rose-500")}>
                          {formatPercentage(returnPct)}
                        </div>
                      </td>
                      <td className="p-4">
                        <button onClick={() => handleDelete(inv.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                          <Activity size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Investment">
        <form className="space-y-4" onSubmit={handleCreate}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Asset Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="e.g. Apple Inc." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Symbol</label>
              <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase"
                placeholder="AAPL" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select value={assetType} onChange={(e) => setAssetType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white">
                <option value="stock">Stocks</option>
                <option value="etf">ETF</option>
                <option value="crypto">Crypto</option>
                <option value="mutual_fund">Mutual Fund</option>
                <option value="bond">Bond</option>
                <option value="commodity">Commodity</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
              <input type="number" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Average Cost</label>
              <input type="number" step="0.01" value={avgCost} onChange={(e) => setAvgCost(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Current Price (optional)</label>
            <input type="number" step="0.01" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="0.00" />
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
