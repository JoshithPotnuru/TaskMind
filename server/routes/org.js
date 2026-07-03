import express from 'express';
import {
  createOrg,
  getOrgs,
  getOrgById,
  updateOrg,
  deleteOrg,
  inviteMember,
  removeMember,
  updateMemberRole,
  getOrgAnalytics,
} from '../controllers/orgController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createOrg);
router.get('/', getOrgs);
router.get('/:orgId', getOrgById);
router.put('/:orgId', updateOrg);
router.delete('/:orgId', deleteOrg);

router.post('/:orgId/invite', inviteMember);
router.post('/:orgId/remove', removeMember);
router.put('/:orgId/role', updateMemberRole);
router.get('/:orgId/analytics', getOrgAnalytics);

export default router;
