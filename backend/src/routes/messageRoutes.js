import { Router } from 'express';
import { getMessages, createMessage, deleteMessage } from '../controllers/messageController.js';

const router = Router();

router.get('/', getMessages);
router.post('/', createMessage);
router.delete('/:id', deleteMessage);

export default router;
