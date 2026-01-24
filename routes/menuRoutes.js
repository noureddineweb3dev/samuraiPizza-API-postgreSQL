import express from 'express';
import { query } from '../db/index.js';
import { validateMenuItem } from '../utils/validation.js';
import { AppError } from '../middleware/errorMiddleware.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { upload } from '../utils/cloudinaryConfig.js';

const router = express.Router();

// GET all menu items
router.get('/', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM menu ORDER BY created_at DESC');
    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET single menu item
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM menu WHERE id = $1', [id]);
    const item = result.rows[0];

    if (!item) {
      throw new AppError(`Couldn't find menu item #${id}`, 404);
    }

    res.json({ status: 'success', data: item });
  } catch (err) {
    next(err);
  }
});

// POST create new menu item (with optional image upload)
router.post('/', protect, restrictTo('admin', 'manager'), upload.single('image'), async (req, res, next) => {
  try {
    const errors = validateMenuItem(req.body);
    if (errors.length > 0) {
      throw new AppError(errors.join(', '), 400);
    }

    const { name, unitPrice, imageUrl, ingredients, soldOut } = req.body;

    // Use uploaded image URL if file was uploaded, otherwise use provided imageUrl
    const finalImageUrl = req.file ? req.file.path : imageUrl;

    // Convert camelCase to snake_case for DB
    const result = await query(
      'INSERT INTO menu (name, unit_price, image_url, ingredients, sold_out) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, unitPrice, finalImageUrl, JSON.stringify(ingredients), soldOut || false]
    );

    res.status(201).json({
      status: 'success',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// PATCH update menu item (with optional image upload)
router.patch('/:id', protect, restrictTo('admin', 'manager'), upload.single('image'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, unitPrice, imageUrl, ingredients, soldOut } = req.body;

    // Check if item exists
    const check = await query('SELECT * FROM menu WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      throw new AppError(`Couldn't find menu item #${id}`, 404);
    }

    // Use uploaded image URL if file was uploaded, otherwise use provided imageUrl
    const finalImageUrl = req.file ? req.file.path : imageUrl;

    // Dynamic update query
    let updateQuery = 'UPDATE menu SET ';
    const values = [];
    let paramCount = 1;

    if (name) { updateQuery += `name = $${paramCount++}, `; values.push(name); }
    if (unitPrice) { updateQuery += `unit_price = $${paramCount++}, `; values.push(unitPrice); }
    if (finalImageUrl) { updateQuery += `image_url = $${paramCount++}, `; values.push(finalImageUrl); }
    if (ingredients) { updateQuery += `ingredients = $${paramCount++}, `; values.push(JSON.stringify(ingredients)); }
    if (soldOut !== undefined) { updateQuery += `sold_out = $${paramCount++}, `; values.push(soldOut); }

    // Remove trailing comma and space
    updateQuery = updateQuery.slice(0, -2);
    updateQuery += ` WHERE id = $${paramCount} RETURNING *`;
    values.push(id);

    const result = await query(updateQuery, values);

    res.json({
      status: 'success',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// DELETE menu item
router.delete('/:id', protect, restrictTo('admin', 'manager'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM menu WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      throw new AppError(`Couldn't find menu item #${id}`, 404);
    }

    res.json({
      status: 'success',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

export default router;
