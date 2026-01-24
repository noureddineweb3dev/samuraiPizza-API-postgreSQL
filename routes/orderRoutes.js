import express from 'express';
import { getOrder, createOrder, updateOrder, getAllOrders, deleteOrder } from '../controllers/orderController.js';

import { isLoggedIn, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', isLoggedIn, createOrder);
router.get('/', protect, getAllOrders);
router.get('/:id', getOrder); // Public for guest access via ID
router.patch('/:id', protect, updateOrder);
router.delete('/:id', protect, deleteOrder);

export default router;
