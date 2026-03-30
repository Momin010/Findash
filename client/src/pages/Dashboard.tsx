import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { monthlyTrendsData, spendingByCategoryData, transactions } from "../data/mockData";
import { cn } from "../lib/utils";

export default function Dashboard() {
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
            <span className="text-3xl font-serif font-bold text-slate-900">$51,090.25</span>
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
            <span className="text-3xl font-serif font-bold text-slate-900">$7,700</span>
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
            <span className="text-3xl font-serif font-bold text-slate-900">$3,003.79</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium">Budget Remaining</span>
            <div className="bg-amber-50 p-2 rounded-lg text-amber-600">
              <PiggyBank size={20} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-serif font-bold text-slate-900">$346.21</span>
            <p className="text-sm text-slate-400 mt-1">of $3,350</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-serif font-bold text-lg mb-6">Monthly Trends</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrendsData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spendingByCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {spendingByCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1e293b' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
            {spendingByCategoryData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs text-slate-500">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-serif font-bold text-lg">Recent Transactions</h3>
          <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">View all</button>
        </div>
        <div className="space-y-4">
          {transactions.slice(0, 5).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
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
              <span className={cn(
                "font-serif font-bold",
                tx.type === 'expense' ? "text-slate-900" : "text-emerald-600"
              )}>
                {tx.type === 'expense' ? `-$${Math.abs(tx.amount)}` : `+$${tx.amount}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
