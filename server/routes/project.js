import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  addMilestone,
  updateMilestoneStatus,
  uploadAttachment,
} from '../controllers/projectController.js';
import { generatePDFReport, generateExcelReport } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:projectId', getProjectById);
router.put('/:projectId', updateProject);
router.delete('/:projectId', deleteProject);

router.post('/:projectId/members', addProjectMember);
router.delete('/:projectId/members', removeProjectMember);

router.post('/:projectId/milestones', addMilestone);
router.put('/:projectId/milestones', updateMilestoneStatus);

router.post('/:projectId/attachments', upload.single('file'), uploadAttachment);

// Report Generation
router.get('/:projectId/pdf', generatePDFReport);
router.get('/:projectId/excel', generateExcelReport);

export default router;
