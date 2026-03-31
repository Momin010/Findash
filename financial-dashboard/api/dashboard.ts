import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, getWorkspaceOwnerId } from './_lib/supabase.js';
import { authenticateUser } from './_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const user = await authenticateUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      return await getDashboardData(req, res, user.id);
    }

    return res.status(404).json({ success: false, error: 'Not found' });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

async function getDashboardData(req: VercelRequest, res: VercelResponse, userId: string) {
  const ownerId = await getWorkspaceOwnerId() || userId;

  // Get summary data
  const [
    { data: accounts },
    { data: transactions },
    { data: budgets },
    { count: txCount }
  ] = await Promise.all([
    supabaseAdmin.from('accounts').select('*').eq('user_id', ownerId).eq('is_active', true),
    supabaseAdmin.from('transactions').select('*').eq('user_id', ownerId).order('transaction_date', { ascending: false }).limit(5),
    supabaseAdmin.from('budgets').select('*').eq('user_id', ownerId).eq('is_active', true),
    supabaseAdmin.from('transactions').select('*', { count: 'exact', head: true }).eq('user_id', ownerId)
  ]);

  // Calculate totals
  const totalBalance = accounts?.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0) || 0;
  const totalAccounts = accounts?.length || 0;

  return res.json({
    success: true,
    data: {
      summary: {
        totalBalance,
        totalAccounts,
        totalTransactions: txCount || 0,
        totalBudgets: budgets?.length || 0
      },
      recentTransactions: transactions || [],
      accounts: accounts || [],
      budgets: budgets || []
    }
  });
}
