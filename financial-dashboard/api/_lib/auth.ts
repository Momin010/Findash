import type { VercelRequest } from '@vercel/node';
import { supabaseAdmin } from './supabase.js';

export async function authenticateUser(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user;
}
