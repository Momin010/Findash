import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';

const router: Router = Router();

// Get all investments
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { data: investments, error } = await supabaseAdmin
      .from('investments')
      .select(`
        *,
        account:accounts(*)
      `)
      .eq('user_id', req.user!.id)
      .order('name');

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    // Calculate market value and gains
    const investmentsWithMetrics = investments.map((investment: any) => {
      const marketValue = (investment.current_price || investment.avg_cost_basis) * investment.quantity;
      const costBasis = investment.avg_cost_basis * investment.quantity;
      const unrealizedGainLoss = marketValue - costBasis;
      const returnPercentage = costBasis > 0 ? (unrealizedGainLoss / costBasis) * 100 : 0;

      return {
        ...investment,
        userId: investment.user_id,
        accountId: investment.account_id,
        assetType: investment.asset_type,
        avgCostBasis: investment.avg_cost_basis,
        currentPrice: investment.current_price,
        purchaseDate: investment.purchase_date,
        createdAt: investment.created_at,
        updatedAt: investment.updated_at,
        account: investment.account ? {
          ...investment.account,
          userId: investment.account.user_id,
          initialBalance: investment.account.initial_balance,
          isActive: investment.account.is_active,
          createdAt: investment.account.created_at,
          updatedAt: investment.account.updated_at,
        } : undefined,
        marketValue,
        unrealizedGainLoss,
        returnPercentage
      };
    });

    res.json({
      success: true,
      data: investmentsWithMetrics
    });
  } catch (error) {
    console.error('Get investments error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create investment
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { accountId, symbol, name, assetType, quantity, avgCostBasis, currentPrice, currency, purchaseDate } = req.body;

    if (!symbol || !name || !assetType || quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Symbol, name, asset type, and quantity are required'
      });
    }

    const { data: investment, error } = await supabaseAdmin
      .from('investments')
      .insert({
        user_id: req.user!.id,
        account_id: accountId,
        symbol,
        name,
        asset_type: assetType,
        quantity,
        avg_cost_basis: avgCostBasis || 0,
        current_price: currentPrice,
        currency: currency || 'USD',
        purchase_date: purchaseDate
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
    const transformedInvestment = {
      ...investment,
      userId: investment.user_id,
      accountId: investment.account_id,
      assetType: investment.asset_type,
      avgCostBasis: investment.avg_cost_basis,
      currentPrice: investment.current_price,
      purchaseDate: investment.purchase_date,
      createdAt: investment.created_at,
      updatedAt: investment.updated_at,
    };

    res.status(201).json({
      success: true,
      data: transformedInvestment
    });
  } catch (error) {
    console.error('Create investment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update investment
router.put('/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { accountId, symbol, name, assetType, quantity, avgCostBasis, currentPrice, currency, purchaseDate } = req.body;

    const { data: investment, error } = await supabaseAdmin
      .from('investments')
      .update({
        account_id: accountId,
        symbol,
        name,
        asset_type: assetType,
        quantity,
        avg_cost_basis: avgCostBasis,
        current_price: currentPrice,
        currency,
        purchase_date: purchaseDate,
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
      data: investment
    });
  } catch (error) {
    console.error('Update investment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete investment
router.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('investments')
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
      message: 'Investment deleted successfully'
    });
  } catch (error) {
    console.error('Delete investment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
