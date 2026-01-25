import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';
import { AppError } from '../middleware/errorMiddleware.js';

const signToken = (id, type) => {
    return jwt.sign({ id, type }, process.env.JWT_SECRET, {
        expiresIn: '90d',
    });
};

// ============ CUSTOMER AUTH ============

export const signupCustomer = async (req, res, next) => {
    try {
        const { fullName, email, phone, password } = req.body;

        if (!fullName || !password || (!email && !phone)) {
            throw new AppError('Please provide full name, password, and either email or phone', 400);
        }

        // Check if customer exists (by email or phone)
        const checks = [];
        if (email) checks.push(query('SELECT * FROM customers WHERE email = $1', [email]));
        if (phone) checks.push(query('SELECT * FROM customers WHERE phone = $1', [phone]));

        const results = await Promise.all(checks);
        if (results.some(r => r.rows.length > 0)) {
            throw new AppError('Email or Phone already in use', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newCustomer = await query(
            'INSERT INTO customers (full_name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, phone, created_at',
            [fullName, email || null, phone || null, hashedPassword]
        );

        const token = signToken(newCustomer.rows[0].id, 'customer');

        res.status(201).json({
            status: 'success',
            token,
            data: {
                user: { ...newCustomer.rows[0], role: 'customer' }, // Frontend expects role
            },
        });
    } catch (err) {
        next(err);
    }
};

export const loginCustomer = async (req, res, next) => {
    try {
        const { identifier, password } = req.body; // identifier can be email or phone

        if (!identifier || !password) {
            throw new AppError('Please provide email/phone and password', 400);
        }

        // Check email OR phone
        const result = await query(
            'SELECT * FROM customers WHERE email = $1 OR phone = $1',
            [identifier]
        );
        const customer = result.rows[0];

        if (!customer || !(await bcrypt.compare(password, customer.password_hash))) {
            throw new AppError('Incorrect credentials', 401);
        }

        const token = signToken(customer.id, 'customer');
        customer.password_hash = undefined;

        res.status(200).json({
            status: 'success',
            token,
            data: {
                user: { ...customer, role: 'customer' },
            },
        });
    } catch (err) {
        next(err);
    }
};

// ============ ADMIN AUTH ============

export const createAdmin = async (req, res, next) => {
    try {
        const { fullName, username, password, role } = req.body;

        if (!fullName || !username || !password) {
            throw new AppError('Please provide full name, username and password', 400);
        }

        const userCheck = await query('SELECT * FROM admins WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            throw new AppError('Username already in use', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        // Default role to 'staff' if not provided, or restrict 'admin' creation to super-admins only ideally
        const safeRole = ['admin', 'manager', 'staff'].includes(role) ? role : 'staff';

        const newAdmin = await query(
            'INSERT INTO admins (full_name, username, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, username, role, created_at',
            [fullName, username, hashedPassword, safeRole]
        );

        const token = signToken(newAdmin.rows[0].id, 'admin');

        res.status(201).json({
            status: 'success',
            token,
            data: {
                user: newAdmin.rows[0],
            },
        });
    } catch (err) {
        next(err);
    }
};

export const loginAdmin = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            throw new AppError('Please provide username and password', 400);
        }

        const result = await query('SELECT * FROM admins WHERE username = $1', [username]);
        const admin = result.rows[0];

        if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
            throw new AppError('Incorrect username or password', 401);
        }

        const token = signToken(admin.id, 'admin');
        admin.password_hash = undefined;

        res.status(200).json({
            status: 'success',
            token,
            data: {
                user: admin,
            },
        });
    } catch (err) {
        next(err);
    }
};

export const login = loginCustomer; // Backward compatibility alias if needed, but routes should update
export const signup = signupCustomer; // Backward compatibility alias
