import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { budgetsApi, categoriesApi } from "../lib/api";
import Modal from "../components/Modal";
import CustomSelect, { SelectOption } from "../components/CustomSelect";
import { cn } from "../lib/utils";
import type { Budget, Category } from "../lib/types";

const periodOptions: SelectOption[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

const budgetColors = ['#f59e0b', '#0ea5e9', '#8b5cf6', '#ec4899', '#10b981', '#ef4444'];

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [selectedColor, setSelectedColor] = useState(budgetColors[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [budgetsRes, categoriesRes] = await Promise.all([
        budgetsApi.getAll(),
        categoriesApi.getAll('expense'),
      ]);
      setBudgets(budgetsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error("Error fetching budgets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await budgetsApi.create({
        name,
        amount: parseFloat(amount),
        categoryId: categoryId || undefined,
        period,
        startDate,
      });
      setIsModalOpen(false);
      setName(""); setAmount(""); setCategoryId(""); setPeriod("monthly");
      setStartDate(new Date().toISOString().split('T')[0]);
      fetchData();
    } catch (error) {
      console.error("Error creating budget:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await budgetsApi.delete(id);
      fetchData();
    } catch (error) {
      console.error("Error deleting budget:", error);
    }
  };

  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
  const totalLimit = budgets.reduce((sum, b) => sum + b.amount, 0);

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
          <h1 className="text-3xl font-bold text-slate-900">Budgets</h1>
          <p className="text-slate-500 mt-1">{formatCurrency(totalSpent)} of {formatCurrency(totalLimit)} spent</p>
        </div>
        <button onClick={() => setIsModalOpen(true)}
          className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus size={18} /> Add Budget
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <h3 className="text-lg font-medium text-slate-900 mb-2">No budgets yet</h3>
          <p className="text-slate-500 mb-4">Create your first budget to track spending</p>
          <button onClick={() => setIsModalOpen(true)}
            className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2.5 rounded-xl font-medium transition-colors">
            Create Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map((budget) => {
            const spent = budget.spent || 0;
            const percentage = budget.amount > 0 ? Math.min(Math.round((spent / budget.amount) * 100), 100) : 0;
            const remaining = budget.amount - spent;
            const color = budget.category?.color || budgetColors[budgets.indexOf(budget) % budgetColors.length];
            const isOverBudget = percentage > 100;
            const isNearLimit = percentage > (budget.alertThreshold || 0.8) * 100;

            return (
              <div key={budget.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative group transition-all hover:shadow-md">
                <button onClick={() => handleDelete(budget.id)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={18} />
                </button>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                  <h3 className="font-serif font-bold text-slate-900">{budget.name}</h3>
                </div>
                <div className="mb-2 flex justify-between items-end">
                  <div>
                    <span className="text-2xl font-serif font-bold text-slate-900">{formatCurrency(spent)}</span>
                    <span className="text-sm text-slate-500 ml-1">of {formatCurrency(budget.amount)}</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
                  <div className="h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: isOverBudget ? '#ef4444' : isNearLimit ? '#f59e0b' : color }}></div>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>{formatCurrency(Math.max(remaining, 0))} remaining</span>
                  <span className={cn(isOverBudget ? "text-rose-500 font-medium" : isNearLimit ? "text-amber-500 font-medium" : "")}>{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Budget">
        <form className="space-y-4" onSubmit={handleCreate}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Budget Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="e.g. Monthly Food Budget" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <CustomSelect
              options={[{ value: "", label: "All Categories" }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
              value={categoryId}
              onChange={(value) => setCategoryId(value as string)}
              placeholder="All Categories"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Period</label>
              <CustomSelect
                options={periodOptions}
                value={period}
                onChange={(value) => setPeriod(value as string)}
                placeholder="Select period"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
            <div className="flex gap-2">
              {budgetColors.map(color => (
                <button key={color} type="button" onClick={() => setSelectedColor(color)}
                  className={cn("w-8 h-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform hover:scale-110",
                    selectedColor === color ? "ring-2 ring-offset-2 ring-slate-400" : "")}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors border border-slate-200">Cancel</button>
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
