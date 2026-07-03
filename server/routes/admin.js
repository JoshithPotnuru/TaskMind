import express from 'express';
import {
  getSystemMetrics,
  getAllUsers,
  updateUserRole,
} from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('Super Admin'));

router.get('/metrics', getSystemMetrics);
router.get('/users', getAllUsers);
router.put('/users/role', updateUserRole);

export default router;
