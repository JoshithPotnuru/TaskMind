import express from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  archiveNotification,
  deleteNotification,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllNotificationsRead);
router.put('/:notificationId/read', markNotificationRead);
router.put('/:notificationId/archive', archiveNotification);
router.delete('/:notificationId', deleteNotification);

export default router;
