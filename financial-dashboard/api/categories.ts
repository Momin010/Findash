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

  try {
    if (req.method === 'GET') {
      return await getCategories(req, res, user.id);
    }
    if (req.method === 'POST') {
      return await createCategory(req, res, user.id);
    }

    return res.status(404).json({ success: false, error: 'Not found' });
  } catch (error) {
    console.error('Categories error:', error);
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

async function getCategories(req: VercelRequest, res: VercelResponse, userId: string) {
  const ownerId = await getWorkspaceOwnerId() || userId;
  const { type } = req.query;

  let query = supabaseAdmin
    .from('categories')
    .select('*')
    .eq('user_id', ownerId)
    .order('name');

  if (type) {
    query = query.eq('type', type);
  }

  const { data: categories, error } = await query;

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  const transformed = categories?.map((cat: any) => ({
    ...cat,
    userId: cat.user_id,
    parentId: cat.parent_id,
    isSystem: cat.is_system,
    createdAt: cat.created_at,
    updatedAt: cat.updated_at,
  }));

  return res.json({ success: true, data: transformed });
}

async function createCategory(req: VercelRequest, res: VercelResponse, userId: string) {
  const { name, type, color, icon, parentId } = req.body;
  const ownerId = await getWorkspaceOwnerId() || userId;

  const { data: category, error } = await supabaseAdmin
    .from('categories')
    .insert({
      user_id: ownerId,
      name,
      type,
      color: color || '#3B82F6',
      icon: icon || 'tag',
      parent_id: parentId
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.status(201).json({ success: true, data: category });
}
