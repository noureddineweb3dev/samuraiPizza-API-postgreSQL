import { query } from '../db/index.js';

// Submit or update a rating
export const submitRating = async (req, res) => {
    try {
        const { menuItemId, rating, review, userId, customerId } = req.body;

        if (!menuItemId || !rating || !userId) {
            return res.status(400).json({ error: 'menuItemId, rating, and userId are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Upsert rating (insert or update if exists)
        const result = await query(
            `INSERT INTO ratings (menu_item_id, user_id, customer_id, rating, review, updated_at)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
             ON CONFLICT (menu_item_id, user_id)
             DO UPDATE SET rating = $4, review = $5, updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [menuItemId, userId, customerId || null, rating, review || null]
        );

        res.status(201).json({
            message: 'Rating submitted successfully',
            rating: result.rows[0]
        });
    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).json({ error: 'Failed to submit rating' });
    }
};

// Get ratings for a specific menu item
export const getMenuItemRatings = async (req, res) => {
    try {
        const { menuItemId } = req.params;

        const result = await query(
            `SELECT 
                r.*,
                c.full_name as customer_name
             FROM ratings r
             LEFT JOIN customers c ON r.customer_id = c.id
             WHERE r.menu_item_id = $1
             ORDER BY r.created_at DESC`,
            [menuItemId]
        );

        // Calculate average
        const ratings = result.rows;
        const average = ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

        res.json({
            menuItemId: parseInt(menuItemId),
            average: parseFloat(average.toFixed(1)),
            count: ratings.length,
            ratings
        });
    } catch (error) {
        console.error('Error fetching ratings:', error);
        res.status(500).json({ error: 'Failed to fetch ratings' });
    }
};

// Get all ratings (aggregated by menu item)
export const getAllRatings = async (req, res) => {
    try {
        const result = await query(
            `SELECT 
                menu_item_id,
                COUNT(*) as count,
                AVG(rating) as average
             FROM ratings
             GROUP BY menu_item_id
             ORDER BY average DESC`
        );

        const ratingsMap = {};
        result.rows.forEach(row => {
            ratingsMap[row.menu_item_id] = {
                average: parseFloat(parseFloat(row.average).toFixed(1)),
                count: parseInt(row.count)
            };
        });

        res.json(ratingsMap);
    } catch (error) {
        console.error('Error fetching all ratings:', error);
        res.status(500).json({ error: 'Failed to fetch ratings' });
    }
};

// Get user's rating for a menu item
export const getUserRating = async (req, res) => {
    try {
        const { menuItemId, userId } = req.params;

        const result = await query(
            `SELECT * FROM ratings WHERE menu_item_id = $1 AND user_id = $2`,
            [menuItemId, userId]
        );

        if (result.rows.length === 0) {
            return res.json(null);
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching user rating:', error);
        res.status(500).json({ error: 'Failed to fetch rating' });
    }
};

// Delete a rating
export const deleteRating = async (req, res) => {
    try {
        const { menuItemId, userId } = req.params;

        const result = await query(
            `DELETE FROM ratings WHERE menu_item_id = $1 AND user_id = $2 RETURNING *`,
            [menuItemId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Rating not found' });
        }

        res.json({ message: 'Rating deleted successfully' });
    } catch (error) {
        console.error('Error deleting rating:', error);
        res.status(500).json({ error: 'Failed to delete rating' });
    }
};
