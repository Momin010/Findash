import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../_lib/supabase';

const ALLOWED_EMAILS = [
  'momin.aldahdooh@mowisai.com',
  'wasay@mowisai.com'
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract action from URL path
  const urlPath = req.url || '';
  const pathMatch = urlPath.match(/\/api\/auth\/?([^?]*)/);
  const action = pathMatch ? pathMatch[1] : '';

  console.log('Auth request:', req.method, urlPath, 'action:', action);

  try {
    if ((action === 'register' || urlPath.includes('/register')) && req.method === 'POST') {
      return await handleRegister(req, res);
    }
    if ((action === 'login' || urlPath.includes('/login')) && req.method === 'POST') {
      return await handleLogin(req, res);
    }
    if ((action === 'me' || urlPath.includes('/me')) && req.method === 'GET') {
      return await handleGetMe(req, res);
    }

    return res.status(404).json({ success: false, error: `Not found: ${action}` });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

async function handleRegister(req: VercelRequest, res: VercelResponse) {
  const { email, password, name, companyName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
    return res.status(403).json({ success: false, error: 'Unauthorized email' });
  }

  // Check if first user
  const { data: existingUsers } = await supabaseAdmin.from('users').select('id').limit(1);
  const isFirstUser = !existingUsers || existingUsers.length === 0;

  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    return res.status(400).json({ success: false, error: authError.message });
  }

  // Create profile
  const { error: profileError } = await supabaseAdmin.from('users').insert({
    id: authData.user.id,
    email,
    name,
    company_name: companyName
  });

  if (profileError) {
    return res.status(500).json({ success: false, error: 'Failed to create profile' });
  }

  // Set workspace owner if first user
  if (isFirstUser) {
    await supabaseAdmin.from('workspace_config').update({ owner_id: authData.user.id }).eq('is_active', true);
  }

  return res.status(201).json({ success: true, data: { id: authData.user.id, email } });
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(401).json({ success: false, error: error.message });
  }

  // Get profile
  const { data: profile } = await supabaseAdmin.from('users').select('*').eq('id', data.user.id).single();

  return res.json({
    success: true,
    data: {
      user: profile,
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token
      }
    }
  });
}

async function handleGetMe(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }

  const { data: profile } = await supabaseAdmin.from('users').select('*').eq('id', user.id).single();

  return res.json({ success: true, data: profile });
}
