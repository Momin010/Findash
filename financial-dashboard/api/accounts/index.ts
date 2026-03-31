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
      const { data, error } = await supabaseAdmin.from('accounts').select('*').eq('user_id', ownerId).eq('is_active', true).order('name');
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data: data?.map(transform) });
    }
    if (req.method === 'POST') {
      const { name, type, currency, initialBalance, description } = req.body;
      const ownerId = await getWorkspaceOwnerId() || user.id;
      const { data, error } = await supabaseAdmin.from('accounts').insert({
        user_id: ownerId, name, type, currency: currency || 'USD',
        balance: initialBalance || 0, initial_balance: initialBalance || 0, description
      }).select().single();
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.status(201).json({ success: true, data: transform(data) });
    }
    return res.status(405).end();
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
}

function transform(acc: any) {
  return { ...acc, userId: acc.user_id, initialBalance: acc.initial_balance, isActive: acc.is_active, createdAt: acc.created_at, updatedAt: acc.updated_at };
}
