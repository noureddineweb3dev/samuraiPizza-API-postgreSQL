import express from 'express';
import { signup, login, createAdmin } from '../controllers/authController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

router.post('/create-admin', protect, restrictTo('admin'), createAdmin);

export default router;
