import { Router, Request, Response } from 'express';
import { supabaseAdmin, getWorkspaceOwnerId } from '../lib/supabase';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';

const router: Router = Router();

// Get all accounts (shared between workspace users)
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const ownerId = await getWorkspaceOwnerId() || req.user!.id;
    
    const { data: accounts, error } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('user_id', ownerId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    // Transform snake_case to camelCase for frontend
    const transformedAccounts = accounts?.map((acc: any) => ({
      ...acc,
      userId: acc.user_id,
      initialBalance: acc.initial_balance,
      isActive: acc.is_active,
      createdAt: acc.created_at,
      updatedAt: acc.updated_at,
    }));

    res.json({
      success: true,
      data: transformedAccounts
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get account by ID
router.get('/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const { data: account, error } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    // Transform snake_case to camelCase for frontend
    const transformedAccount = {
      ...account,
      userId: account.user_id,
      initialBalance: account.initial_balance,
      isActive: account.is_active,
      createdAt: account.created_at,
      updatedAt: account.updated_at,
    };

    res.json({
      success: true,
      data: transformedAccount
    });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create account (always created under workspace owner)
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, type, currency, initialBalance, description, createdAt } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Name and type are required'
      });
    }

    const ownerId = await getWorkspaceOwnerId() || req.user!.id;

    const { data: account, error } = await supabaseAdmin
      .from('accounts')
      .insert({
        user_id: ownerId,
        name,
        type,
        currency: currency || 'USD',
        balance: initialBalance || 0,
        initial_balance: initialBalance || 0,
        description,
        created_at: createdAt || new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    // Transform snake_case to camelCase for frontend
    const transformedAccount = {
      ...account,
      userId: account.user_id,
      initialBalance: account.initial_balance,
      isActive: account.is_active,
      createdAt: account.created_at,
      updatedAt: account.updated_at,
    };

    res.status(201).json({
      success: true,
      data: transformedAccount
    });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update account
router.put('/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, type, currency, description, isActive } = req.body;

    // Check if account exists and belongs to user
    const { data: existingAccount } = await supabaseAdmin
      .from('accounts')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (!existingAccount) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    const { data: account, error } = await supabaseAdmin
      .from('accounts')
      .update({
        name,
        type,
        currency,
        description,
        is_active: isActive,
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

    // Transform snake_case to camelCase for frontend
    const transformedAccount = {
      ...account,
      userId: account.user_id,
      initialBalance: account.initial_balance,
      isActive: account.is_active,
      createdAt: account.created_at,
      updatedAt: account.updated_at,
    };

    res.json({
      success: true,
      data: transformedAccount
    });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete account (soft delete)
router.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Check if account exists and belongs to user
    const { data: existingAccount } = await supabaseAdmin
      .from('accounts')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (!existingAccount) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    const { error } = await supabaseAdmin
      .from('accounts')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
