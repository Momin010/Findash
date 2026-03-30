import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { budgets } from "../data/mockData";
import Modal from "../components/Modal";
import { cn } from "../lib/utils";

export default function Budgets() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Budgets</h1>
          <p className="text-slate-500 mt-1">March 2026 Â· $2,759.79 of $3,350 spent</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add Budget
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map((budget) => {
          const percentage = Math.min(Math.round((budget.spent / budget.limit) * 100), 100);
          const remaining = budget.limit - budget.spent;
          
          return (
            <div key={budget.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative group transition-all hover:shadow-md">
              <button className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={18} />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: budget.color }}></div>
                <h3 className="font-serif font-bold text-slate-900">{budget.category}</h3>
              </div>

              <div className="mb-2 flex justify-between items-end">
                <div>
                  <span className="text-2xl font-serif font-bold text-slate-900">${budget.spent.toLocaleString()}</span>
                  <span className="text-sm text-slate-500 ml-1">of ${budget.limit.toLocaleString()}</span>
                </div>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
                <div 
                  className="h-2.5 rounded-full transition-all duration-500 ease-out" 
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: budget.color
                  }}
                ></div>
              </div>

              <div className="flex justify-between text-sm text-slate-500">
                <span>${remaining > 0 ? remaining.toLocaleString() : '0'} remaining</span>
                <span className={cn(percentage >= 90 ? "text-rose-500 font-medium" : "")}>{percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Budget">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white">
              <option value="">Select category</option>
              <option value="food">Food & Dining</option>
              <option value="transport">Transport</option>
              <option value="shopping">Shopping</option>
              <option value="housing">Housing</option>
              <option value="utilities">Utilities</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Limit</label>
            <input
              type="number"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
            <div className="flex gap-2">
              {['#f59e0b', '#0ea5e9', '#8b5cf6', '#ec4899', '#10b981', '#ef4444'].map(color => (
                <button
                  key={color}
                  type="button"
                  className="w-8 h-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform hover:scale-110"
                  style={{ backgroundColor: color, outlineColor: color }}
                />
              ))}
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
