import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, getWorkspaceOwnerId } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
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
      return await getAccounts(req, res, user.id);
    }
    if (req.method === 'POST' && !action) {
      return await createAccount(req, res, user.id);
    }
    if (req.method === 'GET' && action) {
      return await getAccount(req, res, action);
    }
    if (req.method === 'PUT' && action) {
      return await updateAccount(req, res, action);
    }
    if (req.method === 'DELETE' && action) {
      return await deleteAccount(req, res, action);
    }

    return res.status(404).json({ success: false, error: 'Not found' });
  } catch (error) {
    console.error('Accounts error:', error);
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

async function getAccounts(req: VercelRequest, res: VercelResponse, userId: string) {
  const ownerId = await getWorkspaceOwnerId() || userId;
  
  const { data: accounts, error } = await supabaseAdmin
    .from('accounts')
    .select('*')
    .eq('user_id', ownerId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  const transformed = accounts?.map((acc: any) => ({
    ...acc,
    userId: acc.user_id,
    initialBalance: acc.initial_balance,
    isActive: acc.is_active,
    createdAt: acc.created_at,
    updatedAt: acc.updated_at,
  }));

  return res.json({ success: true, data: transformed });
}

async function createAccount(req: VercelRequest, res: VercelResponse, userId: string) {
  const { name, type, currency, initialBalance, description } = req.body;
  const ownerId = await getWorkspaceOwnerId() || userId;

  const { data: account, error } = await supabaseAdmin
    .from('accounts')
    .insert({
      user_id: ownerId,
      name,
      type,
      currency: currency || 'USD',
      balance: initialBalance || 0,
      initial_balance: initialBalance || 0,
      description
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.status(201).json({
    success: true,
    data: {
      ...account,
      userId: account.user_id,
      initialBalance: account.initial_balance,
      isActive: account.is_active,
      createdAt: account.created_at,
      updatedAt: account.updated_at,
    }
  });
}

async function getAccount(req: VercelRequest, res: VercelResponse, id: string) {
  const { data: account, error } = await supabaseAdmin
    .from('accounts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !account) {
    return res.status(404).json({ success: false, error: 'Account not found' });
  }

  return res.json({
    success: true,
    data: {
      ...account,
      userId: account.user_id,
      initialBalance: account.initial_balance,
      isActive: account.is_active,
      createdAt: account.created_at,
      updatedAt: account.updated_at,
    }
  });
}

async function updateAccount(req: VercelRequest, res: VercelResponse, id: string) {
  const { name, type, currency, description, isActive } = req.body;

  const { data: account, error } = await supabaseAdmin
    .from('accounts')
    .update({ name, type, currency, description, is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({
    success: true,
    data: {
      ...account,
      userId: account.user_id,
      initialBalance: account.initial_balance,
      isActive: account.is_active,
      createdAt: account.created_at,
      updatedAt: account.updated_at,
    }
  });
}

async function deleteAccount(req: VercelRequest, res: VercelResponse, id: string) {
  const { error } = await supabaseAdmin
    .from('accounts')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, message: 'Account deleted' });
}
