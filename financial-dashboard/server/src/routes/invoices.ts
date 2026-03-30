import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';

const router: Router = Router();

// Get all invoices
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { status, client } = req.query;

    let query = supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('issue_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (client) {
      query = query.ilike('client_name', `%${client}%`);
    }

    const { data: invoices, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get invoice by ID with items
router.get('/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*)
      `)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create invoice
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      invoiceNumber,
      clientName,
      clientEmail,
      clientAddress,
      issueDate,
      dueDate,
      items,
      taxRate,
      notes
    } = req.body;

    if (!invoiceNumber || !clientName || !issueDate || !dueDate || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invoice number, client name, dates, and items are required'
      });
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = subtotal * (taxRate || 0) / 100;
    const total = subtotal + taxAmount;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert({
        user_id: req.user!.id,
        invoice_number: invoiceNumber,
        client_name: clientName,
        client_email: clientEmail,
        client_address: clientAddress,
        issue_date: issueDate,
        due_date: dueDate,
        subtotal,
        tax_rate: taxRate || 0,
        tax_amount: taxAmount,
        total,
        notes
      })
      .select()
      .single();

    if (invoiceError) {
      return res.status(500).json({
        success: false,
        error: invoiceError.message
      });
    }

    // Create invoice items
    const invoiceItems = items.map((item: any) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      amount: item.quantity * item.unitPrice
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('invoice_items')
      .insert(invoiceItems);

    if (itemsError) {
      return res.status(500).json({
        success: false,
        error: itemsError.message
      });
    }

    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update invoice status
router.patch('/:id/status', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .update({
        status,
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
      data: invoice
    });
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete invoice
router.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('invoices')
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
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
