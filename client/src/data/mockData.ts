export const accounts = [
  { id: 1, name: "Main Checking", type: "Checking", balance: 5240.50, institution: "Chase Bank", color: "bg-indigo-50" },
  { id: 2, name: "Emergency Savings", type: "Savings", balance: 12800.00, institution: "Ally Bank", color: "bg-emerald-50" },
  { id: 3, name: "Travel Card", type: "Credit Card", balance: -1450.25, institution: "Capital One", color: "bg-amber-50" },
  { id: 4, name: "Brokerage", type: "Investment", balance: 34500.00, institution: "Fidelity", color: "bg-sky-50" },
];

export const transactions = [
  { id: 1, name: "Grocery Run", category: "Food & Dining", date: "Mar 22, 2026", amount: -98.50, type: "expense" },
  { id: 2, name: "Gas Station", category: "Transport", date: "Mar 20, 2026", amount: -52.30, type: "expense" },
  { id: 3, name: "Restaurant Dinner", category: "Food & Dining", date: "Mar 18, 2026", amount: -85.20, type: "expense" },
  { id: 4, name: "Online Course", category: "Education", date: "Mar 15, 2026", amount: -199.00, type: "expense" },
  { id: 5, name: "Amazon Purchase", category: "Shopping", date: "Mar 12, 2026", amount: -67.89, type: "expense" },
  { id: 6, name: "Freelance Project", category: "Income", date: "Mar 10, 2026", amount: 1200.00, type: "income" },
];

export const budgets = [
  { id: 1, category: "Food & Dining", spent: 340.12, limit: 500, color: "#f59e0b" },
  { id: 2, category: "Transport", spent: 100.80, limit: 200, color: "#0ea5e9" },
  { id: 3, category: "Housing", spent: 2100.00, limit: 2200, color: "#8b5cf6" },
  { id: 4, category: "Entertainment", spent: 26.98, limit: 100, color: "#ec4899" },
  { id: 5, category: "Shopping", spent: 67.89, limit: 150, color: "#a855f7" },
  { id: 6, category: "Utilities", spent: 124.00, limit: 200, color: "#10b981" },
];

export const investments = [
  { id: 1, asset: "Apple Inc.", symbol: "AAPL", type: "Stocks", shares: 25, avgCost: 155, current: 198.50, gainLoss: 1087.50, gainLossPct: 28.1 },
  { id: 2, asset: "S&P 500 ETF", symbol: "VOO", type: "ETF", shares: 15, avgCost: 410, current: 465.20, gainLoss: 828.00, gainLossPct: 13.5 },
  { id: 3, asset: "Bitcoin", symbol: "BTC", type: "Crypto", shares: 0.5, avgCost: 42000, current: 68500, gainLoss: 13250.00, gainLossPct: 63.1 },
  { id: 4, asset: "Tesla Inc.", symbol: "TSLA", type: "Stocks", shares: 10, avgCost: 245, current: 218.30, gainLoss: -267.00, gainLossPct: -10.9 },
];

export const monthlyTrendsData = [
  { name: 'Oct', income: 6500, expenses: 2400 },
  { name: 'Nov', income: 6500, expenses: 2400 },
  { name: 'Dec', income: 7800, expenses: 3000 },
  { name: 'Jan', income: 6500, expenses: 2500 },
  { name: 'Feb', income: 6500, expenses: 2300 },
  { name: 'Mar', income: 7700, expenses: 3003.79 },
];

export const spendingByCategoryData = [
  { name: 'Housing', value: 2100, color: '#4f46e5' },
  { name: 'Food & Dining', value: 340.12, color: '#f59e0b' },
  { name: 'Education', value: 199, color: '#10b981' },
  { name: 'Utilities', value: 124, color: '#14b8a6' },
  { name: 'Transport', value: 100.8, color: '#0ea5e9' },
  { name: 'Shopping', value: 67.89, color: '#8b5cf6' },
  { name: 'Healthcare', value: 45, color: '#ef4444' },
  { name: 'Entertainment', value: 26.98, color: '#ec4899' },
];
