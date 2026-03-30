import { Router, Request, Response } from 'express';
import { supabaseAdmin, getWorkspaceOwnerId } from '../lib/supabase';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';

const router: Router = Router();

// Get all budgets (shared between workspace users)
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const ownerId = await getWorkspaceOwnerId() || req.user!.id;
    
    const { data: budgets, error } = await supabaseAdmin
      .from('budgets')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('user_id', ownerId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    // Calculate spent amount for each budget
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const { data: transactions } = await supabaseAdmin
          .from('transactions')
          .select('amount')
          .eq('user_id', ownerId)
          .eq('category_id', budget.category_id)
          .eq('transaction_type', 'expense')
          .gte('transaction_date', budget.start_date)
          .lte('transaction_date', budget.end_date || new Date().toISOString());

        const spent = transactions?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
        const remaining = budget.amount - spent;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        return {
          ...budget,
          userId: budget.user_id,
          categoryId: budget.category_id,
          startDate: budget.start_date,
          endDate: budget.end_date,
          alertThreshold: budget.alert_threshold,
          isActive: budget.is_active,
          createdAt: budget.created_at,
          updatedAt: budget.updated_at,
          category: budget.category ? {
            ...budget.category,
            userId: budget.category.user_id,
            parentId: budget.category.parent_id,
            isSystem: budget.category.is_system,
            createdAt: budget.category.created_at,
            updatedAt: budget.category.updated_at,
          } : undefined,
          spent,
          remaining,
          percentage
        };
      })
    );

    res.json({
      success: true,
      data: budgetsWithSpending
    });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create budget
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { categoryId, name, amount, period, startDate, endDate, alertThreshold } = req.body;

    if (!name || !amount || !period || !startDate) {
      return res.status(400).json({
        success: false,
        error: 'Name, amount, period, and start date are required'
      });
    }

    const { data: budget, error } = await supabaseAdmin
      .from('budgets')
      .insert({
        user_id: req.user!.id,
        category_id: categoryId,
        name,
        amount,
        period,
        start_date: startDate,
        end_date: endDate,
        alert_threshold: alertThreshold || 0.8
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
    const transformedBudget = {
      ...budget,
      userId: budget.user_id,
      categoryId: budget.category_id,
      startDate: budget.start_date,
      endDate: budget.end_date,
      alertThreshold: budget.alert_threshold,
      isActive: budget.is_active,
      createdAt: budget.created_at,
      updatedAt: budget.updated_at,
    };

    res.status(201).json({
      success: true,
      data: transformedBudget
    });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update budget
router.put('/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { categoryId, name, amount, period, startDate, endDate, alertThreshold, isActive } = req.body;

    const { data: budget, error } = await supabaseAdmin
      .from('budgets')
      .update({
        category_id: categoryId,
        name,
        amount,
        period,
        start_date: startDate,
        end_date: endDate,
        alert_threshold: alertThreshold,
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      data: budget
    });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete budget
router.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
