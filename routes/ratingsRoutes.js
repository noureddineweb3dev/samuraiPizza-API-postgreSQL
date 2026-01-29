import express from 'express';
import {
    submitRating,
    getMenuItemRatings,
    getAllRatings,
    getUserRating,
    deleteRating
} from '../controllers/ratingsController.js';

const router = express.Router();

// POST /api/ratings - Submit or update a rating
router.post('/', submitRating);

// GET /api/ratings - Get all ratings aggregated
router.get('/', getAllRatings);

// GET /api/ratings/:menuItemId - Get ratings for a specific menu item
router.get('/:menuItemId', getMenuItemRatings);

// GET /api/ratings/:menuItemId/user/:userId - Get user's rating for a menu item
router.get('/:menuItemId/user/:userId', getUserRating);

// DELETE /api/ratings/:menuItemId/user/:userId - Delete a rating
router.delete('/:menuItemId/user/:userId', deleteRating);

export default router;
