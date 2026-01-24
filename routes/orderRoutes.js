import express from 'express';
import { getOrder, createOrder, updateOrder, getAllOrders, deleteOrder } from '../controllers/orderController.js';

import { isLoggedIn } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', isLoggedIn, createOrder);
router.get('/', getAllOrders);
router.get('/:id', getOrder);
router.patch('/:id', updateOrder);
router.delete('/:id', deleteOrder);

export default router;
