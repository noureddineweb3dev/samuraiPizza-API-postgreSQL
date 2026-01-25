import crypto from 'crypto';
import { query } from '../db/index.js';
import { validateOrder } from '../utils/validation.js';
import { AppError } from '../middleware/errorMiddleware.js';

export async function getOrder(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM orders WHERE id = $1', [id]);
    const order = result.rows[0];

    if (!order) {
      throw new AppError(`Couldn't find order #${id}`, 404);
    }

    // Parse items JSON back to object
    if (order.items) {
      order.cart = order.items; // Frontend expects 'cart'
      delete order.items;
    }

    res.json({
      status: 'success',
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllOrders(req, res, next) {
  try {
    // Admin View: Get all orders
    const result = await query('SELECT * FROM orders ORDER BY created_at DESC');

    const orders = result.rows.map(order => ({
      ...order,
      cart: order.items,
      items: undefined
    }));

    res.json({
      status: 'success',
      data: orders,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyOrders(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await query('SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC', [userId]);

    const orders = result.rows.map(order => ({
      ...order,
      cart: order.items,
      items: undefined
    }));

    res.json({
      status: 'success',
      data: orders,
    });
  } catch (err) {
    next(err);
  }
}

export async function createOrder(req, res, next) {
  try {
    const errors = validateOrder(req.body);
    if (errors.length > 0) {
      throw new AppError(errors.join(', '), 400);
    }

    const { customer, phone, address, priority, cart, orderPrice, priorityPrice, totalPrice } = req.body;

    const id = crypto.randomUUID();
    const userId = req.user ? req.user.id : null;
    const status = 'preparing';
    const estimatedDelivery = new Date(Date.now() + 40 * 60000).toISOString();

    const finalOrderPrice = Number(orderPrice);
    const finalPriorityPrice = Number(priorityPrice || 0);
    const finalTotalPrice = Number(totalPrice);
    const itemsJson = JSON.stringify(cart);

    await query(
      `INSERT INTO orders (id, customer_id, customer, phone, address, priority, order_price, priority_price, total_price, status, items, estimated_delivery)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [id, userId, customer, phone, address, priority, finalOrderPrice, finalPriorityPrice, finalTotalPrice, status, itemsJson, estimatedDelivery]
    );

    const newOrder = {
      id, userId, customer, phone, address, priority,
      orderPrice: finalOrderPrice, priorityPrice: finalPriorityPrice, totalPrice: finalTotalPrice,
      status, cart, estimatedDelivery
    }

    res.status(201).json({
      status: 'success',
      data: newOrder,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Only allowing status update for now as per previous logic
    const result = await query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      throw new AppError(`Couldn't find order #${id}`, 404);
    }

    const order = result.rows[0];
    order.cart = order.items;
    delete order.items;

    res.json({
      status: 'success',
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteOrder(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      throw new AppError(`Couldn't find order #${id}`, 404);
    }

    res.json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    next(err);
  }
}
