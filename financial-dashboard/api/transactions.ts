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
      return await getTransactions(req, res, user.id);
    }
    if (req.method === 'POST' && !action) {
      return await createTransaction(req, res, user.id);
    }
    if (req.method === 'DELETE' && action) {
      return await deleteTransaction(req, res, action);
    }

    return res.status(404).json({ success: false, error: 'Not found' });
  } catch (error) {
    console.error('Transactions error:', error);
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

async function getTransactions(req: VercelRequest, res: VercelResponse, userId: string) {
  const ownerId = await getWorkspaceOwnerId() || userId;
  const { accountId, type, limit = '50' } = req.query;

  let query = supabaseAdmin
    .from('transactions')
    .select('*, account:accounts(*), category:categories(*)')
    .eq('user_id', ownerId)
    .order('transaction_date', { ascending: false })
    .limit(parseInt(limit as string));

  if (accountId) {
    query = query.eq('account_id', accountId);
  }
  if (type) {
    query = query.eq('transaction_type', type);
  }

  const { data: transactions, error } = await query;

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  const transformed = transactions?.map((t: any) => ({
    ...t,
    userId: t.user_id,
    accountId: t.account_id,
    categoryId: t.category_id,
    transactionDate: t.transaction_date,
    transactionType: t.transaction_type,
    isRecurring: t.is_recurring,
    recurringPattern: t.recurring_pattern,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));

  return res.json({ success: true, data: transformed });
}

async function createTransaction(req: VercelRequest, res: VercelResponse, userId: string) {
  const { accountId, categoryId, description, amount, transactionDate, transactionType } = req.body;
  const ownerId = await getWorkspaceOwnerId() || userId;

  const { data: transaction, error } = await supabaseAdmin
    .from('transactions')
    .insert({
      user_id: ownerId,
      account_id: accountId,
      category_id: categoryId,
      description,
      amount,
      transaction_date: transactionDate,
      transaction_type: transactionType,
      currency: 'USD'
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.status(201).json({ success: true, data: transaction });
}

async function deleteTransaction(req: VercelRequest, res: VercelResponse, id: string) {
  const { error } = await supabaseAdmin.from('transactions').delete().eq('id', id);

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, message: 'Transaction deleted' });
}
