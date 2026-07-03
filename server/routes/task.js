import express from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  addChecklistItem,
  toggleChecklistItem,
  addComment,
  deleteComment,
} from '../controllers/taskController.js';
import {
  startTimer,
  stopTimer,
  addManualEntry,
  getTimeLogs,
} from '../controllers/timeTrackController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Task CRUD
router.post('/', createTask);
router.get('/', getTasks);
router.get('/:taskId', getTaskById);
router.put('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);

// Checklist items
router.post('/:taskId/checklist', addChecklistItem);
router.put('/:taskId/checklist', toggleChecklistItem);

// Task Comments
router.post('/:taskId/comments', addComment);
router.delete('/comments/:commentId', deleteComment);

// Time Tracking logs
router.post('/time/start', startTimer);
router.post('/time/stop', stopTimer);
router.post('/time/manual', addManualEntry);
router.get('/time/logs', getTimeLogs);

export default router;
