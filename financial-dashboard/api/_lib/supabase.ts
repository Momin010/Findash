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

// Cache for workspace owner ID
let cachedWorkspaceOwnerId: string | null = null;

export async function getWorkspaceOwnerId() {
  if (cachedWorkspaceOwnerId) {
    return cachedWorkspaceOwnerId;
  }

  const { data, error } = await supabaseAdmin
    .from('workspace_config')
    .select('owner_id')
    .eq('is_active', true)
    .single();

  if (error || !data?.owner_id) {
    return null;
  }

  cachedWorkspaceOwnerId = data.owner_id;
  return data.owner_id;
}

export async function setWorkspaceOwnerId(userId: string) {
  const { error } = await supabaseAdmin
    .from('workspace_config')
    .update({ owner_id: userId })
    .eq('is_active', true);

  if (!error) {
    cachedWorkspaceOwnerId = userId;
  }
}
