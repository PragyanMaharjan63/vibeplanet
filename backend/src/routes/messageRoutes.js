import { Router } from 'express';
import {
  getMessages,
  getMessagesForAdmin,
  createMessage,
  deleteMessage,
} from '../controllers/messageController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public — anyone can view the orbit.
router.get('/', getMessages);

// Admin-only — includes author email for moderation.
router.get('/admin/all', authenticate, requireAdmin, getMessagesForAdmin);

// Any logged-in user can launch a message.
router.post('/', authenticate, createMessage);

// Only admins can delete.
router.delete('/:id', authenticate, requireAdmin, deleteMessage);

export default router;
