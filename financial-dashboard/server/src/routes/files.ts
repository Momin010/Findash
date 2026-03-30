import { Router, Request, Response } from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../lib/supabase';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { fileProcessingService } from '../services/file-processing';

const router: Router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get all uploaded files
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { data: files, error } = await supabaseAdmin
      .from('uploaded_files')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Upload file
router.post('/upload', authenticateUser, upload.single('file'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    const userId = req.user!.id;

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${userId}/${timestamp}-${originalname}`;

    // Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabaseAdmin
      .storage
      .from('uploads')
      .upload(filename, buffer, {
        contentType: mimetype,
        upsert: false
      });

    if (storageError) {
      return res.status(500).json({
        success: false,
        error: storageError.message
      });
    }

    // Save file record to database
    const { data: fileRecord, error: dbError } = await supabaseAdmin
      .from('uploaded_files')
      .insert({
        user_id: userId,
        filename: storageData.path,
        original_name: originalname,
        file_type: mimetype,
        file_size: size,
        storage_path: storageData.path,
        status: 'pending'
      })
      .select()
      .single();

    if (dbError) {
      return res.status(500).json({
        success: false,
        error: dbError.message
      });
    }

    // TODO: Trigger file processing (text extraction, AI analysis)

    res.status(201).json({
      success: true,
      data: fileRecord
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get file by ID
router.get('/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const { data: file, error } = await supabaseAdmin
      .from('uploaded_files')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Generate signed URL for download
    const { data: signedUrl } = await supabaseAdmin
      .storage
      .from('uploads')
      .createSignedUrl(file.storage_path, 3600); // 1 hour expiry

    res.json({
      success: true,
      data: {
        ...file,
        downloadUrl: signedUrl?.signedUrl
      }
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete file
router.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Get file info
    const { data: file } = await supabaseAdmin
      .from('uploaded_files')
      .select('storage_path')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Delete from storage
    await supabaseAdmin
      .storage
      .from('uploads')
      .remove([file.storage_path]);

    // Delete from database
    const { error } = await supabaseAdmin
      .from('uploaded_files')
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
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
