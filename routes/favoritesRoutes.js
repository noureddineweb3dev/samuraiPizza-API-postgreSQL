import express from 'express';
import { getFavorites, addFavorite, removeFavorite } from '../controllers/favoritesController.js';
import { protect } from '../controllers/authController.js';

const router = express.Router();

// Protect all routes
router.use(protect);

router.get('/', getFavorites);
router.post('/', addFavorite);
router.delete('/:pizzaId', removeFavorite);

export default router;
