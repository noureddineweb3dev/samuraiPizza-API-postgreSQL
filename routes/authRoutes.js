import express from 'express';
import {
    signupCustomer, loginCustomer,
    createAdmin, loginAdmin
} from '../controllers/authController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Customer Routes
router.post('/signup', signupCustomer);
router.post('/login', loginCustomer);

// Admin Routes
router.post('/admin/login', loginAdmin);
router.post('/create-admin', protect, restrictTo('admin'), createAdmin);

export default router;
