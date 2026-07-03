import express from 'express';
import {
  sendMessage,
  getMessages,
  markAsRead,
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.post('/', upload.single('file'), sendMessage);
router.get('/', getMessages);
router.post('/read', markAsRead);

export default router;
