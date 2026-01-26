import crypto from 'crypto';
import { query } from '../db/index.js';
import { validateOrder } from '../utils/validation.js';
import { AppError } from '../middleware/errorMiddleware.js';

// Helper to generate short readable IDs: SAP + 7 alphanumeric chars
const generateOrderId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'SAP';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export async function getOrder(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM orders WHERE id = $1', [id]);
    const order = result.rows[0];

    if (!order) {
      throw new AppError(`Couldn't find order #${id}`, 404);
    }

    // Parse items JSON back to object
    // Parse items JSON back to object & Map DB columns to Frontend props
    if (order.items) {
      order.cart = order.items;
      delete order.items;
    }
    // Map snake_case to camelCase
    order.orderPrice = order.order_price;
    order.priorityPrice = order.priority_price;
    order.totalPrice = order.total_price;
    order.date = order.created_at; // Frontend expects 'date'
    order.estimatedDelivery = order.estimated_delivery;

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
      items: undefined,
      // Map properties
      orderPrice: order.order_price,
      priorityPrice: order.priority_price,
      totalPrice: order.total_price,
      date: order.created_at,
      estimatedDelivery: order.estimated_delivery,
      updatedBy: order.updated_by
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
      items: undefined,
      // Map properties
      orderPrice: order.order_price,
      priorityPrice: order.priority_price,
      totalPrice: order.total_price,
      date: order.created_at,
      estimatedDelivery: order.estimated_delivery
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

    const { customer, phone, address, priority, cart } = req.body;

    // Verify cart items and calculate price server-side for security
    const pizzaIds = cart.map(item => item.pizzaId);
    if (pizzaIds.length === 0) throw new AppError('Cart is empty', 400);

    const menuItemsResult = await query('SELECT id, unit_price, name FROM menu WHERE id = ANY($1)', [pizzaIds]);
    const menuItems = menuItemsResult.rows;

    let calculatedOrderPrice = 0;
    const validatedCart = [];

    for (const cartItem of cart) {
      const menuItem = menuItems.find(p => p.id === cartItem.pizzaId);
      if (!menuItem) {
        throw new AppError(`Product with ID ${cartItem.pizzaId} not found`, 404);
      }
      calculatedOrderPrice += menuItem.unit_price * cartItem.quantity;

      // Update cart item with trusted data (optional but good for history)
      validatedCart.push({
        ...cartItem,
        unitPrice: menuItem.unit_price,
        totalPrice: menuItem.unit_price * cartItem.quantity,
        name: menuItem.name
      });
    }

    const finalOrderPrice = calculatedOrderPrice;
    const finalPriorityPrice = priority ? Math.round(finalOrderPrice * 0.2) : 0;
    const finalTotalPrice = finalOrderPrice + finalPriorityPrice;



    const id = generateOrderId();
    const userId = req.user ? req.user.id : null;
    const status = 'placed'; // Initial status
    const estimatedDelivery = new Date(Date.now() + (priority ? 20 : 40) * 60000).toISOString();
    const itemsJson = JSON.stringify(validatedCart);

    await query(
      `INSERT INTO orders (id, customer_id, customer, phone, address, priority, order_price, priority_price, total_price, status, items, estimated_delivery)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [id, userId, customer, phone, address, priority, finalOrderPrice, finalPriorityPrice, finalTotalPrice, status, itemsJson, estimatedDelivery]
    );

    const newOrder = {
      id, userId, customer, phone, address, priority,
      orderPrice: finalOrderPrice, priorityPrice: finalPriorityPrice, totalPrice: finalTotalPrice,
      status, cart: validatedCart, estimatedDelivery
    }

    // Automatically change status to 'pending' after 1 minute (simulation)
    setTimeout(async () => {
      try {
        await query('UPDATE orders SET status = $1 WHERE id = $2 AND status = $3', ['pending', id, 'placed']);
        console.log(`Order ${id} auto-updated to pending`);
      } catch (err) {
        console.error(`Failed to auto-update order ${id}`, err);
      }
    }, 60000);

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
    const updatedBy = req.user ? (req.user.fullName || req.user.full_name) : 'System';

    // Only allowing status update for now as per previous logic
    const result = await query(
      'UPDATE orders SET status = $1, updated_by = $2 WHERE id = $3 RETURNING *',
      [status, updatedBy, id]
    );

    if (result.rows.length === 0) {
      throw new AppError(`Couldn't find order #${id}`, 404);
    }

    const order = result.rows[0];
    order.cart = order.items;
    delete order.items;

    // Map snake_case to camelCase
    order.orderPrice = order.order_price;
    order.priorityPrice = order.priority_price;
    order.totalPrice = order.total_price;
    order.date = order.created_at;
    order.estimatedDelivery = order.estimated_delivery;
    order.updatedBy = order.updated_by; // Map updated_by

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
