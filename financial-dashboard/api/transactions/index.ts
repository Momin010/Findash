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
      const { accountId, type, limit = '50' } = req.query;
      let query = supabaseAdmin.from('transactions').select('*, account:accounts(*), category:categories(*)').eq('user_id', ownerId).order('transaction_date', { ascending: false }).limit(parseInt(limit as string));
      if (accountId) query = query.eq('account_id', accountId);
      if (type) query = query.eq('transaction_type', type);
      const { data, error } = await query;
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data: data?.map(transform) });
    }
    if (req.method === 'POST') {
      const { accountId, categoryId, description, amount, transactionDate, transactionType } = req.body;
      const ownerId = await getWorkspaceOwnerId() || user.id;
      
      // Get account currency
      const { data: account } = await supabaseAdmin.from('accounts').select('currency, balance').eq('id', accountId).single();
      if (!account) return res.status(404).json({ success: false, error: 'Account not found' });
      
      // Calculate new balance
      let newBalance = account.balance;
      if (transactionType === 'expense') {
        newBalance -= Math.abs(amount);
      } else if (transactionType === 'income') {
        newBalance += Math.abs(amount);
      }
      
      // Create transaction and update balance atomically
      const { data, error } = await supabaseAdmin.from('transactions').insert({ 
        user_id: ownerId, 
        account_id: accountId, 
        category_id: categoryId, 
        description, 
        amount, 
        transaction_date: transactionDate, 
        transaction_type: transactionType, 
        currency: account.currency || 'USD' 
      }).select().single();
      
      if (error) return res.status(500).json({ success: false, error: error.message });
      
      // Update account balance
      await supabaseAdmin.from('accounts').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', accountId);
      
      return res.status(201).json({ success: true, data: transform(data) });
    }
    return res.status(405).end();
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
}

function transform(t: any) {
  return { ...t, userId: t.user_id, accountId: t.account_id, categoryId: t.category_id, transactionDate: t.transaction_date, transactionType: t.transaction_type, isRecurring: t.is_recurring, recurringPattern: t.recurring_pattern, createdAt: t.created_at, updatedAt: t.updated_at };
}
