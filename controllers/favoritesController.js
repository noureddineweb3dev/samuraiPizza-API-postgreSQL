import { query } from '../db/index.js';
import { AppError } from '../middleware/errorMiddleware.js';

export async function getFavorites(req, res, next) {
    try {
        const userId = req.user.id;
        // Join with menu to get pizza details
        const result = await query(
            `SELECT m.*, f.created_at as added_at 
       FROM favorites f
       JOIN menu m ON f.pizza_id = m.id
       WHERE f.customer_id = $1
       ORDER BY f.created_at DESC`,
            [userId]
        );

        // Map snake_case to camelCase for frontend
        const favorites = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            unitPrice: row.unit_price,
            ingredients: row.ingredients,
            soldOut: row.sold_out,
            image: row.image_url,
            bestseller: row.bestseller,
            spicy: row.spicy,
            vegetarian: row.vegetarian,
            addedAt: row.added_at
        }));

        res.json({
            status: 'success',
            data: favorites
        });
    } catch (err) {
        next(err);
    }
}

export async function addFavorite(req, res, next) {
    try {
        const userId = req.user.id;
        const { pizzaId } = req.body;

        if (!pizzaId) throw new AppError('Pizza ID is required', 400);

        // Check if pizza exists (optional but good)
        const pizzaResult = await query('SELECT * FROM menu WHERE id = $1', [pizzaId]);
        if (pizzaResult.rows.length === 0) throw new AppError('Pizza not found', 404);
        const pizza = pizzaResult.rows[0];

        await query(
            `INSERT INTO favorites (customer_id, pizza_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [userId, pizzaId]
        );

        // Return the formatted pizza object
        const newFavorite = {
            id: pizza.id,
            name: pizza.name,
            unitPrice: pizza.unit_price,
            ingredients: pizza.ingredients,
            soldOut: pizza.sold_out,
            image: pizza.image_url,
            bestseller: pizza.bestseller,
            spicy: pizza.spicy,
            vegetarian: pizza.vegetarian,
            addedAt: new Date().toISOString()
        };

        res.status(201).json({
            status: 'success',
            data: newFavorite
        });
    } catch (err) {
        next(err);
    }
}

export async function removeFavorite(req, res, next) {
    try {
        const userId = req.user.id;
        const { pizzaId } = req.params;

        await query(
            `DELETE FROM favorites WHERE customer_id = $1 AND pizza_id = $2`,
            [userId, pizzaId]
        );

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        next(err);
    }
}
