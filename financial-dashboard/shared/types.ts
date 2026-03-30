// User Types
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

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  dateFormat: string;
  notifications: boolean;
}

// Account Types
export type AccountType = 'bank' | 'credit_card' | 'investment' | 'crypto' | 'paypal' | 'stripe' | 'cash' | 'other';

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

// Category Types
export type CategoryType = 'income' | 'expense' | 'transfer';

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  parentId?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

// Transaction Types
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

// Budget Types
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

// Investment Types
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

// Invoice Types
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  createdAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  notes?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  items?: InvoiceItem[];
}

// Payment Types
export interface Payment {
  id: string;
  userId: string;
  invoiceId?: string;
  transactionId?: string;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  invoice?: Invoice;
  transaction?: Transaction;
}

// Chat Types
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

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  tokensUsed?: number;
  model?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// File Upload Types
export type FileStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface UploadedFile {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  status: FileStatus;
  extractedText?: string;
  analysis: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Tax Record Types
export interface TaxRecord {
  id: string;
  userId: string;
  taxYear: number;
  category: string;
  description?: string;
  amount: number;
  currency: string;
  isDeductible: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Analytics Types
export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  accountBalances: Record<string, number>;
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

export interface CashFlowProjection {
  date: string;
  projectedBalance: number;
  confidence: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// AI Types
export interface AIInsight {
  type: 'spending' | 'savings' | 'investment' | 'budget' | 'general';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  action?: string;
}

export interface ChatContext {
  userProfile: User;
  accounts: Account[];
  recentTransactions: Transaction[];
  budgets: Budget[];
  uploadedFiles?: UploadedFile[];
}
