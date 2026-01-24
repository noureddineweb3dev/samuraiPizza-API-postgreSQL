import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';
import { AppError } from '../middleware/errorMiddleware.js';

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '90d',
    });
};

export const signup = async (req, res, next) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            throw new AppError('Please provide full name, email and password', 400);
        }

        // Check if user exists
        const userCheck = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            throw new AppError('Email already in use', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await query(
            'INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, full_name, email, created_at',
            [fullName, email, hashedPassword]
        );

        const token = signToken(newUser.rows[0].id);

        res.status(201).json({
            status: 'success',
            token,
            data: {
                user: newUser.rows[0],
            },
        });
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new AppError('Please provide email and password', 400);
        }

        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            throw new AppError('Incorrect email or password', 401);
        }

        const token = signToken(user.id);

        // Remove password from output
        user.password_hash = undefined;

        res.status(200).json({
            status: 'success',
            token,
            data: {
                user,
            },
        });
    } catch (err) {
        next(err);
    }
};
