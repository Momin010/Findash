import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, getWorkspaceOwnerId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const user = await authenticateUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const path = req.query.path || [];
  const action = Array.isArray(path) ? path[0] : path;

  try {
    if (req.method === 'GET' && !action) {
      return await getBudgets(req, res, user.id);
    }
    if (req.method === 'POST' && !action) {
      return await createBudget(req, res, user.id);
    }
    if (req.method === 'DELETE' && action) {
      return await deleteBudget(req, res, action);
    }

    return res.status(404).json({ success: false, error: 'Not found' });
  } catch (error) {
    console.error('Budgets error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

async function authenticateUser(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user;
}

async function getBudgets(req: VercelRequest, res: VercelResponse, userId: string) {
  const ownerId = await getWorkspaceOwnerId() || userId;
  
  const { data: budgets, error } = await supabaseAdmin
    .from('budgets')
    .select('*, category:categories(*)')
    .eq('user_id', ownerId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  // Calculate spending for each budget
  const budgetsWithSpending = await Promise.all(
    budgets.map(async (budget: any) => {
      const { data: transactions } = await supabaseAdmin
        .from('transactions')
        .select('amount')
        .eq('user_id', ownerId)
        .eq('category_id', budget.category_id)
        .eq('transaction_type', 'expense')
        .gte('transaction_date', budget.start_date)
        .lte('transaction_date', budget.end_date || new Date().toISOString());

      const spent = transactions?.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0) || 0;
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return {
        ...budget,
        userId: budget.user_id,
        categoryId: budget.category_id,
        startDate: budget.start_date,
        endDate: budget.end_date,
        alertThreshold: budget.alert_threshold,
        isActive: budget.is_active,
        createdAt: budget.created_at,
        updatedAt: budget.updated_at,
        spent,
        remaining,
        percentage
      };
    })
  );

  return res.json({ success: true, data: budgetsWithSpending });
}

async function createBudget(req: VercelRequest, res: VercelResponse, userId: string) {
  const { name, amount, categoryId, period, startDate } = req.body;
  const ownerId = await getWorkspaceOwnerId() || userId;

  const { data: budget, error } = await supabaseAdmin
    .from('budgets')
    .insert({
      user_id: ownerId,
      name,
      amount,
      category_id: categoryId,
      period,
      start_date: startDate
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.status(201).json({ success: true, data: budget });
}

async function deleteBudget(req: VercelRequest, res: VercelResponse, id: string) {
  const { error } = await supabaseAdmin
    .from('budgets')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, message: 'Budget deleted' });
}
