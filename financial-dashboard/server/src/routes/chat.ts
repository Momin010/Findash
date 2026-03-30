import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { vertexAIService } from '../services/vertex-ai';

const router: Router = Router();

// Get all chat sessions
router.get('/sessions', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { data: sessions, error } = await supabaseAdmin
      .from('chat_sessions')
      .select(`
        *,
        messages:messages(count)
      `)
      .eq('user_id', req.user!.id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Get chat sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get chat session with messages
router.get('/sessions/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const { data: session, error } = await supabaseAdmin
      .from('chat_sessions')
      .select(`
        *,
        messages:messages(*)
      `)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Get chat session error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create chat session
router.post('/sessions', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { title } = req.body;

    const { data: session, error } = await supabaseAdmin
      .from('chat_sessions')
      .insert({
        user_id: req.user!.id,
        title: title || 'New Chat',
        context: {}
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Create chat session error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Send message with Vertex AI integration
router.post('/sessions/:id/messages', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      });
    }

    // Verify session belongs to user
    const { data: session } = await supabaseAdmin
      .from('chat_sessions')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    // Save user message
    const { data: userMessage, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        session_id: id,
        role: 'user',
        content
      })
      .select()
      .single();

    if (messageError) {
      return res.status(500).json({
        success: false,
        error: messageError.message
      });
    }

    // Generate AI response using Vertex AI
    const aiResponse = await vertexAIService.generateResponse(
      req.user!.id,
      content,
      id
    );

    // Save AI message
    const { data: assistantMessage, error: aiError } = await supabaseAdmin
      .from('messages')
      .insert({
        session_id: id,
        role: 'assistant',
        content: aiResponse.content,
        tokens_used: aiResponse.tokensUsed,
        model: aiResponse.model,
        metadata: { insights: aiResponse.insights }
      })
      .select()
      .single();

    if (aiError) {
      return res.status(500).json({
        success: false,
        error: aiError.message
      });
    }

    // Update session timestamp
    await supabaseAdmin
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    res.json({
      success: true,
      data: {
        userMessage,
        assistantMessage
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete chat session
router.delete('/sessions/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('chat_sessions')
      .update({ is_active: false })
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
      message: 'Chat session deleted successfully'
    });
  } catch (error) {
    console.error('Delete chat session error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
