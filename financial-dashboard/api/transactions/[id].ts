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
    // Get transaction to verify ownership and reverse balance
    const { data: transaction, error: fetchError } = await supabaseAdmin.from('transactions').select('amount, transaction_type, account_id, user_id').eq('id', id).single();
    if (fetchError || !transaction) return res.status(404).json({ success: false, error: 'Transaction not found' });
    
    // Verify user owns this transaction
    if (transaction.user_id !== user.id) return res.status(403).json({ success: false, error: 'Forbidden' });
    
    // Get account current balance
    const { data: account, error: accountError } = await supabaseAdmin.from('accounts').select('balance').eq('id', transaction.account_id).single();
    if (accountError || !account) return res.status(404).json({ success: false, error: 'Account not found' });
    
    // Calculate reversed balance
    let newBalance = account.balance;
    if (transaction.transaction_type === 'expense') {
      newBalance += Math.abs(transaction.amount); // Add back the expense
    } else if (transaction.transaction_type === 'income') {
      newBalance -= Math.abs(transaction.amount); // Subtract the income
    }
    
    // Delete transaction
    const { error: deleteError } = await supabaseAdmin.from('transactions').delete().eq('id', id);
    if (deleteError) return res.status(500).json({ success: false, error: deleteError.message });
    
    // Update account balance
    await supabaseAdmin.from('accounts').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', transaction.account_id);
    
    return res.json({ success: true, message: 'Transaction deleted' });
  }
  return res.status(405).end();
}
