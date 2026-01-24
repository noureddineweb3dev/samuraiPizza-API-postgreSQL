import express from 'express';
import { readData, writeData } from '../utils/persistence.js';
import { menu as initialMenu } from '../data/menu.js';
import { validateMenuItem } from '../utils/validation.js';
import { AppError } from '../middleware/errorMiddleware.js';

const router = express.Router();
const MENU_FILE = 'menu.json';

// Helper to ensure data exists
async function getMenu() {
  let menu = await readData(MENU_FILE);
  if (menu.length === 0) {
    // Initialize from JS if JSON doesn't exist
    menu = initialMenu;
    await writeData(MENU_FILE, menu);
  }
  return menu;
}

// GET all menu items
router.get('/', async (req, res, next) => {
  try {
    const menu = await getMenu();
    res.json({ status: 'success', data: menu });
  } catch (err) {
    next(err);
  }
});

// GET single menu item
router.get('/:id', async (req, res, next) => {
  try {
    const menu = await getMenu();
    const { id } = req.params;
    const item = menu.find((m) => m.id === id);

    if (!item) {
      throw new AppError(`Couldn't find menu item #${id}`, 404);
    }

    res.json({ status: 'success', data: item });
  } catch (err) {
    next(err);
  }
});

// POST create new menu item
router.post('/', async (req, res, next) => {
  try {
    const errors = validateMenuItem(req.body);
    if (errors.length > 0) {
      throw new AppError(errors.join(', '), 400);
    }

    const menu = await getMenu();
    const newItem = {
      id: req.body.id || `item-${Date.now()}`,
      available: true,
      ...req.body,
    };

    menu.push(newItem);
    await writeData(MENU_FILE, menu);

    res.status(201).json({
      status: 'success',
      data: newItem,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH update menu item
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const menu = await getMenu();
    const itemIndex = menu.findIndex((m) => m.id === id);

    if (itemIndex === -1) {
      throw new AppError(`Couldn't find menu item #${id}`, 404);
    }

    menu[itemIndex] = { ...menu[itemIndex], ...req.body };
    await writeData(MENU_FILE, menu);

    res.json({
      status: 'success',
      data: menu[itemIndex],
    });
  } catch (err) {
    next(err);
  }
});

// DELETE menu item
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const menu = await getMenu();
    const itemIndex = menu.findIndex((m) => m.id === id);

    if (itemIndex === -1) {
      throw new AppError(`Couldn't find menu item #${id}`, 404);
    }

    const deleted = menu.splice(itemIndex, 1)[0];
    await writeData(MENU_FILE, menu);

    res.json({
      status: 'success',
      data: deleted,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
