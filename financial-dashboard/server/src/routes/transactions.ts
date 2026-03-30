import { Router, Request, Response } from 'express';
import { supabaseAdmin, getWorkspaceOwnerId } from '../lib/supabase';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';

const router: Router = Router();

// Get all transactions (shared between workspace users)
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { accountId, categoryId, startDate, endDate, type, limit = '50', offset = '0' } = req.query;
    const ownerId = await getWorkspaceOwnerId() || req.user!.id;

    let query = supabaseAdmin
      .from('transactions')
      .select(`
        *,
        account:accounts(*),
        category:categories(*)
      `)
      .eq('user_id', ownerId)
      .order('transaction_date', { ascending: false })
      .limit(parseInt(limit as string));

    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (type) {
      query = query.eq('transaction_type', type);
    }

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }

    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    const { data: transactions, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    // Manual offset
    const offsetNum = parseInt(offset as string);
    const paginatedTransactions = transactions?.slice(offsetNum, offsetNum + parseInt(limit as string));

    // Transform snake_case to camelCase for frontend
    const transformedTransactions = paginatedTransactions?.map((t: any) => ({
      ...t,
      userId: t.user_id,
      accountId: t.account_id,
      categoryId: t.category_id,
      transactionDate: t.transaction_date,
      transactionType: t.transaction_type,
      isRecurring: t.is_recurring,
      recurringPattern: t.recurring_pattern,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      account: t.account ? {
        ...t.account,
        userId: t.account.user_id,
        initialBalance: t.account.initial_balance,
        isActive: t.account.is_active,
        createdAt: t.account.created_at,
        updatedAt: t.account.updated_at,
      } : undefined,
      category: t.category ? {
        ...t.category,
        userId: t.category.user_id,
        parentId: t.category.parent_id,
        isSystem: t.category.is_system,
        createdAt: t.category.created_at,
        updatedAt: t.category.updated_at,
      } : undefined,
    }));

    res.json({
      success: true,
      data: transformedTransactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get transaction by ID
router.get('/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const { data: transaction, error } = await supabaseAdmin
      .from('transactions')
      .select(`
        *,
        account:accounts(*),
        category:categories(*)
      `)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Transform snake_case to camelCase for frontend
    const transformedTransaction = {
      ...transaction,
      userId: transaction.user_id,
      accountId: transaction.account_id,
      categoryId: transaction.category_id,
      transactionDate: transaction.transaction_date,
      transactionType: transaction.transaction_type,
      isRecurring: transaction.is_recurring,
      recurringPattern: transaction.recurring_pattern,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at,
      account: transaction.account ? {
        ...transaction.account,
        userId: transaction.account.user_id,
        initialBalance: transaction.account.initial_balance,
        isActive: transaction.account.is_active,
        createdAt: transaction.account.created_at,
        updatedAt: transaction.account.updated_at,
      } : undefined,
      category: transaction.category ? {
        ...transaction.category,
        userId: transaction.category.user_id,
        parentId: transaction.category.parent_id,
        isSystem: transaction.category.is_system,
        createdAt: transaction.category.created_at,
        updatedAt: transaction.category.updated_at,
      } : undefined,
    };

    res.json({
      success: true,
      data: transformedTransaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create transaction
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      accountId,
      categoryId,
      description,
      amount,
      currency,
      transactionDate,
      transactionType,
      tags,
      metadata
    } = req.body;

    if (!accountId || !description || amount === undefined || !transactionDate || !transactionType) {
      return res.status(400).json({
        success: false,
        error: 'Account ID, description, amount, transaction date, and type are required'
      });
    }

    // Verify account belongs to user
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('id, currency, balance')
      .eq('id', accountId)
      .eq('user_id', req.user!.id)
      .single();

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    // Create transaction
    const { data: transaction, error } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: req.user!.id,
        account_id: accountId,
        category_id: categoryId,
        description,
        amount,
        currency: currency || account.currency,
        transaction_date: transactionDate,
        transaction_type: transactionType,
        tags: tags || [],
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    // Update account balance
    const balanceChange = transactionType === 'income' ? amount : -amount;
    const newBalance = (account.balance || 0) + balanceChange;
    await supabaseAdmin
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', accountId);

    // Transform snake_case to camelCase for frontend
    const transformedTransaction = {
      ...transaction,
      userId: transaction.user_id,
      accountId: transaction.account_id,
      categoryId: transaction.category_id,
      transactionDate: transaction.transaction_date,
      transactionType: transaction.transaction_type,
      isRecurring: transaction.is_recurring,
      recurringPattern: transaction.recurring_pattern,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at,
    };

    res.status(201).json({
      success: true,
      data: transformedTransaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update transaction
router.put('/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const {
      accountId,
      categoryId,
      description,
      amount,
      currency,
      transactionDate,
      transactionType,
      status,
      tags,
      metadata
    } = req.body;

    // Check if transaction exists and belongs to user
    const { data: existingTransaction } = await supabaseAdmin
      .from('transactions')
      .select('id, account_id, amount, transaction_type')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    const { data: transaction, error } = await supabaseAdmin
      .from('transactions')
      .update({
        account_id: accountId,
        category_id: categoryId,
        description,
        amount,
        currency,
        transaction_date: transactionDate,
        transaction_type: transactionType,
        status,
        tags,
        metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    // Update account balance if amount or type changed
    if (existingTransaction.account_id === accountId) {
      const oldChange = existingTransaction.transaction_type === 'income' ? existingTransaction.amount : -existingTransaction.amount;
      const newChange = transactionType === 'income' ? amount : -amount;
      const balanceAdjustment = newChange - oldChange;
      
      if (balanceAdjustment !== 0) {
        const { data: account } = await supabaseAdmin
          .from('accounts')
          .select('balance')
          .eq('id', accountId)
          .single();
        
        await supabaseAdmin
          .from('accounts')
          .update({ balance: (account?.balance || 0) + balanceAdjustment })
          .eq('id', accountId);
      }
    }

    // Transform snake_case to camelCase for frontend
    const transformedTransaction = {
      ...transaction,
      userId: transaction.user_id,
      accountId: transaction.account_id,
      categoryId: transaction.category_id,
      transactionDate: transaction.transaction_date,
      transactionType: transaction.transaction_type,
      isRecurring: transaction.is_recurring,
      recurringPattern: transaction.recurring_pattern,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at,
    };

    res.json({
      success: true,
      data: transformedTransaction
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete transaction
router.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Check if transaction exists and belongs to user
    const { data: existingTransaction } = await supabaseAdmin
      .from('transactions')
      .select('id, account_id, amount, transaction_type')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    const { error } = await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    // Restore account balance
    const balanceChange = existingTransaction.transaction_type === 'income' ? existingTransaction.amount : -existingTransaction.amount;
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('balance')
      .eq('id', existingTransaction.account_id)
      .single();
    
    await supabaseAdmin
      .from('accounts')
      .update({ balance: (account?.balance || 0) - balanceChange })
      .eq('id', existingTransaction.account_id);

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
