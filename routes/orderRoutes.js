import express from 'express';
import { getOrder, createOrder, updateOrder, getAllOrders, deleteOrder, getMyOrders } from '../controllers/orderController.js';

import { isLoggedIn, protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', isLoggedIn, createOrder);
router.get('/', protect, restrictTo('admin', 'manager', 'staff'), getAllOrders);
router.get('/own', protect, getMyOrders);
router.get('/:id', getOrder); // Public for guest access via ID
router.patch('/:id', protect, restrictTo('admin', 'manager', 'staff'), updateOrder);
router.delete('/:id', protect, restrictTo('admin', 'manager'), deleteOrder);

export default router;
