import { Router } from 'express';
import { supabaseAdmin, setWorkspaceOwnerId, getWorkspaceOwnerId } from '../lib/supabase.js';

const router = Router();

// Allowed emails for the two-person workspace
const ALLOWED_EMAILS = [
  'momin.aldahdooh@mowisai.com',
  'wasay@mowisai.com'
];

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, companyName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Check if email is allowed
    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
      return res.status(403).json({
        success: false,
        error: 'This application is restricted to authorized users only'
      });
    }

    // Check if this is the first user (to set as workspace owner)
    const { data: existingUsers } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);
    
    const isFirstUser = !existingUsers || existingUsers.length === 0;

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      return res.status(400).json({
        success: false,
        error: authError.message
      });
    }

    // Create user profile
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        company_name: companyName
      });

    if (profileError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create user profile'
      });
    }

    // If this is the first user, set them as the workspace owner
    if (isFirstUser) {
      await setWorkspaceOwnerId(authData.user.id);
    }

    // Create default categories for the workspace (only once, by first user)
    if (isFirstUser) {
      const defaultCategories = [
        // Income categories
        { name: 'Salary', type: 'income', color: '#10B981', icon: 'briefcase', is_system: true },
        { name: 'Freelance', type: 'income', color: '#34D399', icon: 'laptop', is_system: true },
        { name: 'Investments', type: 'income', color: '#6EE7B7', icon: 'trending-up', is_system: true },
        { name: 'Gifts', type: 'income', color: '#A7F3D0', icon: 'gift', is_system: true },
        { name: 'Other Income', type: 'income', color: '#D1FAE5', icon: 'plus-circle', is_system: true },
        // Expense categories
        { name: 'Food & Dining', type: 'expense', color: '#EF4444', icon: 'utensils', is_system: true },
        { name: 'Transportation', type: 'expense', color: '#F87171', icon: 'car', is_system: true },
        { name: 'Shopping', type: 'expense', color: '#FCA5A5', icon: 'shopping-bag', is_system: true },
        { name: 'Entertainment', type: 'expense', color: '#FECACA', icon: 'film', is_system: true },
        { name: 'Bills & Utilities', type: 'expense', color: '#F87171', icon: 'zap', is_system: true },
        { name: 'Healthcare', type: 'expense', color: '#EF4444', icon: 'heart-pulse', is_system: true },
        { name: 'Education', type: 'expense', color: '#FCA5A5', icon: 'book-open', is_system: true },
        { name: 'Travel', type: 'expense', color: '#FECACA', icon: 'plane', is_system: true },
        { name: 'Housing', type: 'expense', color: '#F87171', icon: 'home', is_system: true },
        { name: 'Subscriptions', type: 'expense', color: '#FCA5A5', icon: 'credit-card', is_system: true },
        { name: 'Personal Care', type: 'expense', color: '#FECACA', icon: 'smile', is_system: true },
        { name: 'Other Expense', type: 'expense', color: '#FEE2E2', icon: 'minus-circle', is_system: true },
        // Transfer
        { name: 'Transfer', type: 'transfer', color: '#3B82F6', icon: 'arrow-left-right', is_system: true },
      ];

      const categoriesWithUserId = defaultCategories.map(cat => ({
        ...cat,
        user_id: authData.user.id
      }));

      await supabaseAdmin
        .from('categories')
        .insert(categoriesWithUserId);
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: authData.user.id,
        email: authData.user.email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: error.message
      });
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          ...profile
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const token = authHeader.split(' ')[1];
    
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        ...profile
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
