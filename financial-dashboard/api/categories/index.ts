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
      const { type } = req.query;
      
      // Fetch user's own categories + system categories
      let query = supabaseAdmin.from('categories').select('*').or(`user_id.eq.${ownerId},user_id.is.null`).order('name');
      if (type) query = query.eq('type', type);
      const { data, error } = await query;
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data: data?.map((cat: any) => ({ ...cat, userId: cat.user_id, parentId: cat.parent_id, isSystem: cat.is_system, createdAt: cat.created_at, updatedAt: cat.updated_at })) });
    }
    if (req.method === 'POST') {
      const { name, type, color, icon, parentId } = req.body;
      const ownerId = await getWorkspaceOwnerId() || user.id;
      const { data, error } = await supabaseAdmin.from('categories').insert({ user_id: ownerId, name, type, color: color || '#3B82F6', icon: icon || 'tag', parent_id: parentId }).select().single();
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.status(201).json({ success: true, data });
    }
    return res.status(405).end();
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
}
