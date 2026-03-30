import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabase';

const ALLOWED_EMAILS = ['momin.aldahdooh@mowisai.com', 'wasay@mowisai.com'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password, name, companyName } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, error: 'Email and password required' });

  if (!ALLOWED_EMAILS.includes(email.toLowerCase()))
    return res.status(403).json({ success: false, error: 'Unauthorized email' });

  const { data: existingUsers } = await supabaseAdmin.from('users').select('id').limit(1);
  const isFirstUser = !existingUsers || existingUsers.length === 0;

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true
  });

  if (authError) return res.status(400).json({ success: false, error: authError.message });

  const { error: profileError } = await supabaseAdmin.from('users').insert({
    id: authData.user.id, email, name, company_name: companyName
  });

  if (profileError) return res.status(500).json({ success: false, error: 'Failed to create profile' });

  if (isFirstUser)
    await supabaseAdmin.from('workspace_config').update({ owner_id: authData.user.id }).eq('is_active', true);

  return res.status(201).json({ success: true, data: { id: authData.user.id, email } });
}
