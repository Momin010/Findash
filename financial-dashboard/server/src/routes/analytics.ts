import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';

const router: Router = Router();

// Get financial summary
router.get('/summary', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    // Get all accounts
    const { data: accounts } = await supabaseAdmin
      .from('accounts')
      .select('balance, currency')
      .eq('user_id', userId)
      .eq('is_active', true);

    // Get current month transactions
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: transactions } = await supabaseAdmin
      .from('transactions')
      .select('amount, transaction_type')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('transaction_date', startOfMonth.toISOString());

    // Calculate totals
    const totalBalance = accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0;
    
    const totalIncome = transactions
      ?.filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0) || 0;
    
    const totalExpenses = transactions
      ?.filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalBalance,
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate
      }
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get spending by category
router.get('/spending-by-category', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    let query = supabaseAdmin
      .from('transactions')
      .select(`
        amount,
        category:categories(id, name, color)
      `)
      .eq('user_id', userId)
      .eq('transaction_type', 'expense')
      .eq('status', 'completed');

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }

    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    const { data: transactions, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    // Group by category
    const categoryMap = new Map();
    let totalSpending = 0;

    transactions?.forEach((t: any) => {
      if (t.category) {
        const categoryId = t.category.id;
        const amount = Math.abs(t.amount);
        totalSpending += amount;

        if (categoryMap.has(categoryId)) {
          categoryMap.get(categoryId).amount += amount;
        } else {
          categoryMap.set(categoryId, {
            categoryId,
            categoryName: t.category.name,
            categoryColor: t.category.color,
            amount
          });
        }
      }
    });

    const spendingByCategory = Array.from(categoryMap.values())
      .map((cat: any) => ({
        ...cat,
        percentage: totalSpending > 0 ? (cat.amount / totalSpending) * 100 : 0
      }))
      .sort((a: any, b: any) => b.amount - a.amount);

    res.json({
      success: true,
      data: spendingByCategory
    });
  } catch (error) {
    console.error('Get spending by category error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get monthly data
router.get('/monthly', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { months = '12' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months as string) + 1);
    startDate.setDate(1);

    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select('amount, transaction_type, transaction_date')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString());

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    // Group by month
    const monthlyMap = new Map();

    // Initialize all months
    for (let i = 0; i < parseInt(months as string); i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toISOString().slice(0, 7); // YYYY-MM
      monthlyMap.set(monthKey, {
        month: monthKey,
        income: 0,
        expenses: 0,
        savings: 0
      });
    }

    // Aggregate transactions
    transactions?.forEach((t) => {
      const monthKey = t.transaction_date.slice(0, 7);
      if (monthlyMap.has(monthKey)) {
        const data = monthlyMap.get(monthKey);
        if (t.transaction_type === 'income') {
          data.income += t.amount;
        } else if (t.transaction_type === 'expense') {
          data.expenses += Math.abs(t.amount);
        }
        data.savings = data.income - data.expenses;
      }
    });

    const monthlyData = Array.from(monthlyMap.values())
      .sort((a: any, b: any) => a.month.localeCompare(b.month));

    res.json({
      success: true,
      data: monthlyData
    });
  } catch (error) {
    console.error('Get monthly data error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get account balances
router.get('/account-balances', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const { data: accounts, error } = await supabaseAdmin
      .from('accounts')
      .select('name, type, balance')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('balance', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('Get account balances error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
