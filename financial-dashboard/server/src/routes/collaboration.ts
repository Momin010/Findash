import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';

const router: Router = Router();

// Get all shared dashboards for current user (owned + collaborated)
router.get('/dashboards', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    // Get dashboards owned by user
    const { data: ownedDashboards, error: ownedError } = await supabaseAdmin
      .from('shared_dashboards')
      .select(`
        *,
        owner:owner_id(id, name, email),
        collaborators:dashboard_collaborators(
          id,
          role,
          invited_at,
          accepted_at,
          user:user_id(id, name, email)
        )
      `)
      .eq('owner_id', userId)
      .eq('is_active', true);

    if (ownedError) {
      return res.status(500).json({
        success: false,
        error: ownedError.message
      });
    }

    // Get dashboards user collaborates on
    const { data: collaboratedDashboards, error: collabError } = await supabaseAdmin
      .from('dashboard_collaborators')
      .select(`
        dashboard:dashboard_id(
          *,
          owner:owner_id(id, name, email),
          collaborators:dashboard_collaborators(
            id,
            role,
            invited_at,
            accepted_at,
            user:user_id(id, name, email)
          )
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (collabError) {
      return res.status(500).json({
        success: false,
        error: collabError.message
      });
    }

    // Transform data
    const transformedOwned = ownedDashboards?.map(d => ({
      ...d,
      ownerId: d.owner_id,
      isActive: d.is_active,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      collaborators: d.collaborators?.map((c: any) => ({
        ...c,
        userId: c.user_id,
        invitedBy: c.invited_by,
        invitedAt: c.invited_at,
        acceptedAt: c.accepted_at,
        isActive: c.is_active,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        user: c.user ? {
          ...c.user,
          createdAt: c.user.created_at,
          updatedAt: c.user.updated_at,
        } : undefined,
      })) || [],
    })) || [];

    const transformedCollaborated = collaboratedDashboards?.map((c: any) => {
      const dashboardData: any = c.dashboard || {};
      return {
        ...dashboardData,
        ownerId: dashboardData.owner_id,
        isActive: dashboardData.is_active,
        createdAt: dashboardData.created_at,
        updatedAt: dashboardData.updated_at,
        collaborators: dashboardData.collaborators?.map((col: any) => ({
          ...col,
          userId: col.user_id,
          invitedBy: col.invited_by,
          invitedAt: col.invited_at,
          acceptedAt: col.accepted_at,
          isActive: col.is_active,
          createdAt: col.created_at,
          updatedAt: col.updated_at,
          user: col.user ? {
            ...col.user,
            createdAt: col.user.created_at,
            updatedAt: col.user.updated_at,
          } : undefined,
        })) || [],
      };
    }) || [];

    res.json({
      success: true,
      data: {
        owned: transformedOwned,
        collaborated: transformedCollaborated,
        all: [...transformedOwned, ...transformedCollaborated]
      }
    });
  } catch (error) {
    console.error('Get dashboards error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create a new shared dashboard
router.post('/dashboards', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, description, memberEmails } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Dashboard name is required'
      });
    }

    if (!memberEmails || !Array.isArray(memberEmails) || memberEmails.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one member email is required to create a shared dashboard'
      });
    }

    const userId = req.user!.id;
    const ownerEmail = req.user!.email?.toLowerCase();

    // Deduplicate and normalize provided member emails
    const uniqueEmails = [...new Set(memberEmails.map((e: string) => e.toLowerCase()))];

    // Ensure at least one member besides the creator
    const invitedEmails = uniqueEmails.filter((email) => email !== ownerEmail);

    if (invitedEmails.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'You must invite at least one other user (not yourself) to create a shared dashboard'
      });
    }

    // Validate that all invited member emails exist as users
    const { data: existingUsers, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .in('email', invitedEmails);

    if (userCheckError) {
      return res.status(500).json({
        success: false,
        error: 'Error validating member emails'
      });
    }

    if (!existingUsers || existingUsers.length !== invitedEmails.length) {
      const foundEmails = existingUsers?.map(u => u.email.toLowerCase()) || [];
      const missingEmails = invitedEmails.filter(e => !foundEmails.includes(e));
      return res.status(400).json({
        success: false,
        error: `The following email(s) do not exist: ${missingEmails.join(', ')}`
      });
    }

    // Create the dashboard
    const { data: dashboard, error: dashboardError } = await supabaseAdmin
      .from('shared_dashboards')
      .insert({
        owner_id: userId,
        name,
        description
      })
      .select()
      .single();

    if (dashboardError) {
      return res.status(500).json({
        success: false,
        error: dashboardError.message
      });
    }

    // Add the creator as an 'admin' collaborator
    const { error: creatorCollabError } = await supabaseAdmin
      .from('dashboard_collaborators')
      .insert({
        dashboard_id: dashboard.id,
        user_id: userId,
        invited_by: userId,
        role: 'admin',
        accepted_at: new Date().toISOString(),
        is_active: true
      });

    if (creatorCollabError) {
      console.error('Error adding creator as collaborator:', creatorCollabError);
      return res.status(500).json({
        success: false,
        error: 'Failed to add creator as collaborator'
      });
    }

    // Add all invited members as 'editor' collaborators
    const collaboratorInserts = existingUsers!.map((user: any) => ({
      dashboard_id: dashboard.id,
      user_id: user.id,
      invited_by: userId,
      role: 'editor',
      accepted_at: new Date().toISOString(), // Auto-accept invited members
      is_active: true
    }));

    const { error: membersCollabError } = await supabaseAdmin
      .from('dashboard_collaborators')
      .insert(collaboratorInserts);

    if (membersCollabError) {
      console.error('Error adding members as collaborators:', membersCollabError);
      return res.status(500).json({
        success: false,
        error: 'Failed to add members to dashboard'
      });
    }

    // Create notifications for each invited member
    const notifications = existingUsers!.map((user: any) => ({
      user_id: user.id,
      type: 'dashboard_invitation',
      title: 'Dashboard Shared',
      message: `${req.user!.email} shared a dashboard "${name}" with you`,
      data: JSON.stringify({ dashboard_id: dashboard.id, action: 'view_dashboard' }),
      is_read: false
    }));

    await supabaseAdmin
      .from('notifications')
      .insert(notifications);

    // Transform response
    const transformedDashboard = {
      ...dashboard,
      ownerId: dashboard.owner_id,
      isActive: dashboard.is_active,
      createdAt: dashboard.created_at,
      updatedAt: dashboard.updated_at,
    };

    res.status(201).json({
      success: true,
      data: transformedDashboard
    });
  } catch (error) {
    console.error('Create dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Invite collaborator to dashboard
router.post('/dashboards/:dashboardId/invite', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { dashboardId } = req.params;
    const { email, role = 'viewer' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Check if dashboard exists and user owns it
    const { data: dashboard, error: dashboardError } = await supabaseAdmin
      .from('shared_dashboards')
      .select('id, name')
      .eq('id', dashboardId)
      .eq('owner_id', req.user!.id)
      .single();

    if (dashboardError || !dashboard) {
      return res.status(404).json({
        success: false,
        error: 'Dashboard not found or access denied'
      });
    }

    // Find user by email
    const { data: invitedUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('email', email)
      .single();

    if (userError || !invitedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found with this email'
      });
    }

    // Check if already invited
    const { data: existingInvite } = await supabaseAdmin
      .from('dashboard_collaborators')
      .select('id')
      .eq('dashboard_id', dashboardId)
      .eq('user_id', invitedUser.id)
      .single();

    if (existingInvite) {
      return res.status(400).json({
        success: false,
        error: 'User is already invited to this dashboard'
      });
    }

    // Create collaborator record
    const { data: collaborator, error: collabError } = await supabaseAdmin
      .from('dashboard_collaborators')
      .insert({
        dashboard_id: dashboardId,
        user_id: invitedUser.id,
        role,
        invited_by: req.user!.id
      })
      .select()
      .single();

    if (collabError) {
      return res.status(500).json({
        success: false,
        error: collabError.message
      });
    }

    // Create notification
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: invitedUser.id,
        type: 'dashboard_invitation',
        title: 'Dashboard Invitation',
        message: `You have been invited to collaborate on "${dashboard.name}"`,
        data: {
          dashboardId,
          dashboardName: dashboard.name,
          invitedBy: req.user!.id,
          role
        }
      });

    if (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    res.json({
      success: true,
      message: 'Invitation sent successfully'
    });
  } catch (error) {
    console.error('Invite collaborator error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Accept dashboard invitation
router.post('/invitations/:dashboardId/accept', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { dashboardId } = req.params;
    const userId = req.user!.id;

    // Find and update the invitation (collaborator record)
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('dashboard_collaborators')
      .update({
        accepted_at: new Date().toISOString(),
        is_active: true
      })
      .eq('dashboard_id', dashboardId)
      .eq('user_id', userId)
      .select(`
        *,
        dashboard:shared_dashboards(name)
      `)
      .single();

    if (inviteError || !invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
    }

    // Mark notification as read
    await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('type', 'dashboard_invitation')
      .like('data', `%"dashboardId":"${dashboardId}"%`);

    res.json({
      success: true,
      message: `Successfully joined "${invitation.dashboard.name}"`
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Decline dashboard invitation
router.post('/invitations/:dashboardId/decline', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { dashboardId } = req.params;
    const userId = req.user!.id;

    // Find and delete the invitation (collaborator record)
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('dashboard_collaborators')
      .delete()
      .eq('dashboard_id', dashboardId)
      .eq('user_id', userId)
      .select(`
        *,
        dashboard:shared_dashboards(name)
      `)
      .single();

    if (inviteError || !invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
    }

    // Mark notification as read
    await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('type', 'dashboard_invitation')
      .like('data', `%"dashboardId":"${dashboardId}"%`);

    res.json({
      success: true,
      message: 'Invitation declined'
    });
  } catch (error) {
    console.error('Decline invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get notifications for current user
router.get('/notifications', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    // Transform response
    const transformedNotifications = notifications?.map(n => ({
      ...n,
      userId: n.user_id,
      isRead: n.is_read,
      createdAt: n.created_at,
    })) || [];

    res.json({
      success: true,
      data: transformedNotifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
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
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get shared dashboard data (accounts, transactions, etc.)
router.get('/dashboards/:dashboardId/data', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { dashboardId } = req.params;
    const userId = req.user!.id;

    // Check if user has access to this dashboard via ownership or collaboration
    const { data: dashboard, error: dashboardError } = await supabaseAdmin
      .from('shared_dashboards')
      .select('owner_id')
      .eq('id', dashboardId)
      .single();

    if (dashboardError || !dashboard) {
      return res.status(404).json({
        success: false,
        error: 'Dashboard not found'
      });
    }

    if (dashboard.owner_id !== userId) {
      const { data: collabAccess, error: collabAccessError } = await supabaseAdmin
        .from('dashboard_collaborators')
        .select('id')
        .eq('dashboard_id', dashboardId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (collabAccessError || !collabAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this dashboard'
        });
      }
    }

    const ownerId = dashboard.owner_id;

    // Get all data for the dashboard owner
    const [accountsRes, transactionsRes, categoriesRes, budgetsRes] = await Promise.all([
      supabaseAdmin.from('accounts').select('*').eq('user_id', ownerId).eq('is_active', true),
      supabaseAdmin.from('transactions').select(`
        *,
        account:accounts(*),
        category:categories(*)
      `).eq('user_id', ownerId).order('transaction_date', { ascending: false }),
      supabaseAdmin.from('categories').select('*').eq('user_id', ownerId),
      supabaseAdmin.from('budgets').select(`
        *,
        category:categories(*)
      `).eq('user_id', ownerId).eq('is_active', true)
    ]);

    // Transform data
    const transformedData = {
      accounts: accountsRes.data?.map((acc: any) => ({
        ...acc,
        userId: acc.user_id,
        initialBalance: acc.initial_balance,
        isActive: acc.is_active,
        createdAt: acc.created_at,
        updatedAt: acc.updated_at,
      })) || [],
      transactions: transactionsRes.data?.map((tx: any) => ({
        ...tx,
        userId: tx.user_id,
        accountId: tx.account_id,
        categoryId: tx.category_id,
        transactionDate: tx.transaction_date,
        transactionType: tx.transaction_type,
        isRecurring: tx.is_recurring,
        recurringPattern: tx.recurring_pattern,
        createdAt: tx.created_at,
        updatedAt: tx.updated_at,
        account: tx.account ? {
          ...tx.account,
          userId: tx.account.user_id,
          initialBalance: tx.account.initial_balance,
          isActive: tx.account.is_active,
          createdAt: tx.account.created_at,
          updatedAt: tx.account.updated_at,
        } : undefined,
        category: tx.category ? {
          ...tx.category,
          userId: tx.category.user_id,
          parentId: tx.category.parent_id,
          isSystem: tx.category.is_system,
          createdAt: tx.category.created_at,
          updatedAt: tx.category.updated_at,
        } : undefined,
      })) || [],
      categories: categoriesRes.data?.map((cat: any) => ({
        ...cat,
        userId: cat.user_id,
        parentId: cat.parent_id,
        isSystem: cat.is_system,
        createdAt: cat.created_at,
        updatedAt: cat.updated_at,
      })) || [],
      budgets: budgetsRes.data?.map((budget: any) => ({
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
      })) || []
    };

    res.json({
      success: true,
      data: transformedData
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;