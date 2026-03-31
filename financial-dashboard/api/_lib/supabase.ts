import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const supabaseAdmin = supabase;

export async function getWorkspaceOwnerId() {
  const { data, error } = await supabaseAdmin
    .from('workspace_config')
    .select('owner_id')
    .eq('is_active', true)
    .single();

  if (error || !data?.owner_id) {
    return null;
  }

  return data.owner_id;
}

export async function setWorkspaceOwnerId(userId: string) {
  const { data: existingConfig } = await supabaseAdmin
    .from('workspace_config')
    .select('id')
    .eq('is_active', true)
    .single();

  if (existingConfig) {
    await supabaseAdmin.from('workspace_config').update({ owner_id: userId }).eq('id', existingConfig.id);
  } else {
    await supabaseAdmin.from('workspace_config').insert({ owner_id: userId, is_active: true });
  }
}
