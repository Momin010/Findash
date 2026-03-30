import { Router, Request, Response } from 'express';
import { supabaseAdmin, getWorkspaceOwnerId } from '../lib/supabase';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';

const router: Router = Router();

// Get all categories (shared between workspace users)
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { type } = req.query;
    const ownerId = await getWorkspaceOwnerId() || req.user!.id;

    let query = supabaseAdmin
      .from('categories')
      .select('*')
      .eq('user_id', ownerId)
      .order('name');

    if (type) {
      query = query.eq('type', type);
    }

    const { data: categories, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    // Transform snake_case to camelCase for frontend
    const transformedCategories = categories?.map((cat: any) => ({
      ...cat,
      userId: cat.user_id,
      parentId: cat.parent_id,
      isSystem: cat.is_system,
      createdAt: cat.created_at,
      updatedAt: cat.updated_at,
    }));

    res.json({
      success: true,
      data: transformedCategories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create category
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, type, color, icon, parentId } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Name and type are required'
      });
    }

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .insert({
        user_id: req.user!.id,
        name,
        type,
        color: color || '#3B82F6',
        icon: icon || 'tag',
        parent_id: parentId
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
    const transformedCategory = {
      ...category,
      userId: category.user_id,
      parentId: category.parent_id,
      isSystem: category.is_system,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    };

    res.status(201).json({
      success: true,
      data: transformedCategory
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update category
router.put('/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, color, icon } = req.body;

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .update({
        name,
        color,
        icon,
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
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete category
router.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .eq('is_system', false);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
