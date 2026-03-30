export interface User {
  id: string;
  email: string;
  name?: string;
  companyName?: string;
  baseCurrency: string;
  timezone: string;
  preferences: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type AccountType = 'bank' | 'credit_card' | 'investment' | 'crypto' | 'paypal' | 'stripe' | 'cash' | 'mobilepay' | 'other';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  initialBalance: number;
  description?: string;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type CategoryType = 'income' | 'expense' | 'transfer';

export interface Category {
  id: string;
  userId?: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  parentId?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionStatus = 'pending' | 'completed' | 'cancelled';

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId?: string;
  description: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  transactionDate: string;
  transactionType: TransactionType;
  status: TransactionStatus;
  isRecurring: boolean;
  recurringPattern?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  account?: Account;
  category?: Category;
}

export type BudgetPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Budget {
  id: string;
  userId: string;
  categoryId?: string;
  name: string;
  amount: number;
  period: BudgetPeriod;
  startDate: string;
  endDate?: string;
  alertThreshold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  spent?: number;
  remaining?: number;
  percentage?: number;
}

export type AssetType = 'stock' | 'bond' | 'etf' | 'mutual_fund' | 'crypto' | 'commodity' | 'other';

export interface Investment {
  id: string;
  userId: string;
  accountId?: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  quantity: number;
  avgCostBasis: number;
  currentPrice?: number;
  currency: string;
  purchaseDate?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  account?: Account;
  marketValue?: number;
  unrealizedGainLoss?: number;
  returnPercentage?: number;
}

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
}

export interface SpendingByCategory {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  percentage: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface ChatSession {
  id: string;
  userId: string;
  title?: string;
  context: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokensUsed?: number;
  model?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Collaboration types
export type CollaboratorRole = 'viewer' | 'editor' | 'admin';

export interface SharedDashboard {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  collaborators?: DashboardCollaborator[];
}

export interface DashboardCollaborator {
  id: string;
  dashboardId: string;
  userId: string;
  role: CollaboratorRole;
  invitedBy: string;
  invitedAt: string;
  acceptedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export type NotificationType = 'dashboard_invitation' | 'transaction_alert' | 'budget_alert' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface SharedDashboardData {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
}
