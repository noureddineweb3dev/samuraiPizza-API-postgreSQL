import jwt from 'jsonwebtoken';
import { AppError } from './errorMiddleware.js';
import { query } from '../db/index.js';

export const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('You are not logged in', 401));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const result = await query('SELECT * FROM users WHERE id = $1', [decoded.id]);
        const currentUser = result.rows[0];

        if (!currentUser) {
            return next(new AppError('The user belonging to this token no longer exists', 401));
        }

        req.user = currentUser;
        next();
    } catch (err) {
        next(new AppError('Invalid token or expired login', 401));
    }
};

export const isLoggedIn = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) return next();

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const result = await query('SELECT * FROM users WHERE id = $1', [decoded.id]);
        if (result.rows.length) {
            req.user = result.rows[0];
        }
        next();
    } catch (err) {
        // If invalid token, just proceed as guest
        next();
    }
};

export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
