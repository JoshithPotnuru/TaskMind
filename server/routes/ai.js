import express from 'express';
import {
  prioritizeTask,
  generateTask,
  smartSearch,
  predictDeadline,
  planSprint,
  codeAssistant,
  summarizeMeeting,
  getProductivityInsights,
  detectRisks,
  chatCompletion,
} from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/prioritize', prioritizeTask);
router.post('/generate', generateTask);
router.post('/search', smartSearch);
router.post('/predict', predictDeadline);
router.post('/plan-sprint', planSprint);
router.post('/code', codeAssistant);
router.post('/meeting', summarizeMeeting);
router.get('/insights', getProductivityInsights);
router.post('/risks', detectRisks);
router.post('/chat', chatCompletion);

export default router;
