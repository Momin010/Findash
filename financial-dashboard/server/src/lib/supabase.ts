import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

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

// Get the workspace owner ID - both users share data under this owner
export async function getWorkspaceOwnerId(): Promise<string | null> {
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

// Set the workspace owner ID (called when first user registers)
export async function setWorkspaceOwnerId(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('workspace_config')
    .update({ owner_id: userId })
    .eq('is_active', true);

  if (!error) {
    cachedWorkspaceOwnerId = userId;
  }
}
