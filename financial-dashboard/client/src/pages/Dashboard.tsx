import { useEffect, useState } from "react";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Link } from "react-router-dom";
import { analyticsApi, transactionsApi } from "../lib/api";
import { cn } from "../lib/utils";
import type { FinancialSummary, MonthlyData, SpendingByCategory, Transaction } from "../lib/types";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatDate(dateStr: string) {
  if (!dateStr) return 'No date';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Dashboard() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [spendingByCategory, setSpendingByCategory] = useState<SpendingByCategory[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, monthlyRes, spendingRes, txRes] = await Promise.all([
          analyticsApi.getSummary(),
          analyticsApi.getMonthly(6),
          analyticsApi.getSpendingByCategory(),
          transactionsApi.getAll({ limit: '5' }),
        ]);
        setSummary(summaryRes.data);
        setMonthlyData(monthlyRes.data || []);
        setSpendingByCategory(spendingRes.data || []);
        setRecentTransactions(txRes.data || []);
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4f46e5]"></div>
      </div>
    );
  }

  const totalBudgetRemaining = summary ? summary.totalIncome - summary.totalExpenses : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Your financial overview at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium">Total Balance</span>
            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
              <Wallet size={20} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-serif font-bold text-slate-900">{formatCurrency(summary?.totalBalance || 0)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium">Monthly Income</span>
            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-serif font-bold text-slate-900">{formatCurrency(summary?.totalIncome || 0)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium">Monthly Expenses</span>
            <div className="bg-rose-50 p-2 rounded-lg text-rose-600">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-serif font-bold text-slate-900">{formatCurrency(summary?.totalExpenses || 0)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium">Savings Rate</span>
            <div className="bg-amber-50 p-2 rounded-lg text-amber-600">
              <PiggyBank size={20} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-serif font-bold text-slate-900">{formatPercentage(summary?.savingsRate || 0)}</span>
            <p className="text-sm text-slate-400 mt-1">{formatCurrency(totalBudgetRemaining)} saved</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-serif font-bold text-lg mb-6">Monthly Trends</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData.map(m => ({ name: m.month.slice(5), income: m.income, expenses: m.expenses }))} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
              <span className="text-sm text-slate-500">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
              <span className="text-sm text-slate-500">Expenses</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-serif font-bold text-lg mb-6">Spending by Category</h3>
          <div className="h-72 flex items-center justify-center">
            {spendingByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendingByCategory.map(c => ({ name: c.categoryName, value: c.amount, color: c.categoryColor }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {spendingByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.categoryColor} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1e293b' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400">No spending data yet</p>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
            {spendingByCategory.map((item) => (
              <div key={item.categoryId} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.categoryColor }}></div>
                <span className="text-xs text-slate-500">{item.categoryName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-serif font-bold text-lg">Recent Transactions</h3>
          <Link to="/transactions" className="text-sm text-indigo-600 font-medium hover:text-indigo-700">View all</Link>
        </div>
        {recentTransactions.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No transactions yet</p>
        ) : (
          <div className="space-y-4">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2 rounded-xl",
                    tx.transactionType === 'expense' ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                  )}>
                    {tx.transactionType === 'expense' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{tx.description}</p>
                    <p className="text-sm text-slate-500">{tx.category?.name || 'Uncategorized'} · {formatDate(tx.transactionDate)}</p>
                  </div>
                </div>
                <span className={cn(
                  "font-serif font-bold",
                  tx.transactionType === 'expense' ? "text-slate-900" : "text-emerald-600"
                )}>
                  {tx.transactionType === 'expense' ? `-${formatCurrency(Math.abs(tx.amount))}` : `+${formatCurrency(tx.amount)}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
