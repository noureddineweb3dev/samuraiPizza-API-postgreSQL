import express from 'express';
import {
    signupCustomer, loginCustomer,
    createAdmin, loginAdmin,
    getAllAdmins, updateAdmin
} from '../controllers/authController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Customer Routes
router.post('/signup', signupCustomer);
router.post('/login', loginCustomer);

// Admin Routes
router.post('/admin/login', loginAdmin);
router.post('/create-admin', protect, restrictTo('admin'), createAdmin);
router.get('/admins', protect, restrictTo('admin'), getAllAdmins);
router.patch('/admins/:id', protect, restrictTo('admin'), updateAdmin);

export default router;
