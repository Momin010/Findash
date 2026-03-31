import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, getWorkspaceOwnerId } from '../_lib/supabase.js';
import { authenticateUser } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await authenticateUser(req);
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const ownerId = await getWorkspaceOwnerId() || user.id;
      const { data: budgets, error } = await supabaseAdmin.from('budgets').select('*, category:categories(*)').eq('user_id', ownerId).eq('is_active', true).order('name');
      if (error) return res.status(500).json({ success: false, error: error.message });

      const withSpending = await Promise.all(budgets.map(async (budget: any) => {
        const { data: txs } = await supabaseAdmin.from('transactions').select('amount').eq('user_id', ownerId).eq('category_id', budget.category_id).eq('transaction_type', 'expense').gte('transaction_date', budget.start_date).lte('transaction_date', budget.end_date || new Date().toISOString());
        const spent = txs?.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0) || 0;
        return { ...budget, userId: budget.user_id, categoryId: budget.category_id, startDate: budget.start_date, endDate: budget.end_date, alertThreshold: budget.alert_threshold, isActive: budget.is_active, createdAt: budget.created_at, updatedAt: budget.updated_at, spent, remaining: budget.amount - spent, percentage: budget.amount > 0 ? (spent / budget.amount) * 100 : 0 };
      }));

      return res.json({ success: true, data: withSpending });
    }
    if (req.method === 'POST') {
      const { name, amount, categoryId, period, startDate } = req.body;
      const ownerId = await getWorkspaceOwnerId() || user.id;
      const { data, error } = await supabaseAdmin.from('budgets').insert({ user_id: ownerId, name, amount, category_id: categoryId, period, start_date: startDate }).select().single();
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.status(201).json({ success: true, data });
    }
    return res.status(405).end();
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
}
