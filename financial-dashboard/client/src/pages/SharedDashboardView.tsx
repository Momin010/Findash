import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Settings, Share2 } from "lucide-react";
import { collaborationApi } from "../lib/api";
import { SharedDashboardData } from "../lib/types";
import { cn } from "../lib/utils";

export default function SharedDashboardView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SharedDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadDashboardData();
    }
  }, [id]);

  const loadDashboardData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await collaborationApi.getSharedDashboardData(id);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || "Failed to load dashboard data");
      }
    } catch (err) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/shared')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Shared Dashboard</h1>
            <p className="text-slate-500 mt-1">Loading dashboard data...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/shared')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Shared Dashboard</h1>
            <p className="text-slate-500 mt-1">Access shared financial data</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-center py-12">
            <Share2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Error Loading Dashboard</h3>
            <p className="text-slate-500">{error || "Dashboard not found or access denied"}</p>
            <button
              onClick={() => navigate('/shared')}
              className="mt-4 bg-[#4f46e5] hover:bg-[#4338ca] text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
            >
              Back to Shared Dashboards
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalBalance = data.accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalIncome = data.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = data.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/shared')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Shared Dashboard</h1>
            <p className="text-slate-500 mt-1">Collaborative financial overview</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Users className="w-5 h-5 text-slate-600" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Balance</p>
              <p className="text-2xl font-bold text-slate-900">${totalBalance.toLocaleString()}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <div className="w-6 h-6 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Income</p>
              <p className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <div className="w-6 h-6 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <div className="w-6 h-6 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Net Income</p>
              <p className={cn(
                "text-2xl font-bold",
                totalIncome - totalExpenses >= 0 ? "text-green-600" : "text-red-600"
              )}>
                ${(totalIncome - totalExpenses).toLocaleString()}
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-full",
              totalIncome - totalExpenses >= 0 ? "bg-green-100" : "bg-red-100"
            )}>
              <div className={cn(
                "w-6 h-6 rounded-full",
                totalIncome - totalExpenses >= 0 ? "bg-green-500" : "bg-red-500"
              )}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Accounts</h3>
        <div className="space-y-3">
          {data.accounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-medium text-slate-900">{account.name}</p>
                <p className="text-sm text-slate-500">{account.type}</p>
              </div>
              <p className="text-lg font-semibold text-slate-900">${account.balance.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {data.transactions.slice(0, 10).map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-medium text-slate-900">{transaction.description}</p>
                <p className="text-sm text-slate-500">
                  {new Date(transaction.date).toLocaleDateString()} • {transaction.category?.name || 'Uncategorized'}
                </p>
              </div>
              <p className={cn(
                "text-lg font-semibold",
                transaction.type === 'income' ? "text-green-600" : "text-red-600"
              )}>
                {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Budgets Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Budgets</h3>
        <div className="space-y-3">
          {data.budgets.map((budget) => {
            const spent = data.transactions
              .filter(t => t.categoryId === budget.categoryId && t.type === 'expense')
              .reduce((sum, t) => sum + t.amount, 0);
            const percentage = (spent / budget.amount) * 100;

            return (
              <div key={budget.id} className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-slate-900">{budget.category?.name || 'Unknown Category'}</p>
                  <p className="text-sm text-slate-500">${spent.toLocaleString()} / ${budget.amount.toLocaleString()}</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      percentage > 100 ? "bg-red-500" : percentage > 80 ? "bg-yellow-500" : "bg-green-500"
                    )}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}