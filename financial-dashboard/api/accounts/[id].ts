import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabase.js';
import { authenticateUser } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await authenticateUser(req);
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const id = req.query.id as string;

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin.from('accounts').select('*').eq('id', id).eq('user_id', user.id).single();
      if (error || !data) return res.status(404).json({ success: false, error: 'Not found' });
      return res.json({ success: true, data: transform(data) });
    }
    if (req.method === 'PUT') {
      const { name, type, currency, description, isActive } = req.body;
      const { data, error } = await supabaseAdmin.from('accounts').update({ name, type, currency, description, is_active: isActive, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().single();
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data: transform(data) });
    }
    if (req.method === 'DELETE') {
      const { error } = await supabaseAdmin.from('accounts').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id);
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, message: 'Account deleted' });
    }
    return res.status(405).end();
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
}

function transform(acc: any) {
  return { ...acc, userId: acc.user_id, initialBalance: acc.initial_balance, isActive: acc.is_active, createdAt: acc.created_at, updatedAt: acc.updated_at };
}
