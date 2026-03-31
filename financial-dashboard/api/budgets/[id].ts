import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabase.js';
import { authenticateUser } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await authenticateUser(req);
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const id = req.query.id as string;

  if (req.method === 'DELETE') {
    const { error } = await supabaseAdmin.from('budgets').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, message: 'Budget deleted' });
  }
  return res.status(405).end();
}
