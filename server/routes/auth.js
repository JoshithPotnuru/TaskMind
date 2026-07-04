import express from 'express';
import {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  refreshToken,
  oauthLogin,
  logout,
  changePassword,
  updateProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import seedData from '../services/seedService.js';

const router = express.Router();

router.get('/seed-db', async (req, res, next) => {
  try {
    await seedData();
    res.json({ message: 'Database seeded successfully with demo users!' });
  } catch (error) {
    next(error);
  }
});

router.post('/register', register);
router.post('/login', login);
router.post('/verify', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);
router.post('/oauth-login', oauthLogin);
router.post('/logout', logout);
router.put('/change-password', protect, changePassword);
router.put('/profile', protect, updateProfile);

export default router;
