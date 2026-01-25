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

        // Check if user still exists based on token type
        const table = decoded.type === 'admin' ? 'admins' : 'customers';
        const result = await query(`SELECT * FROM ${table} WHERE id = $1`, [decoded.id]);
        const currentUser = result.rows[0];

        if (!currentUser) {
            return next(new AppError('The user belonging to this token no longer exists', 401));
        }

        // Attach role if managing admins (customers might default to 'customer' role if column missing, but we added it in controller response)
        // Ensure consistent role property on req.user
        if (decoded.type === 'customer' && !currentUser.role) {
            currentUser.role = 'customer';
        }

        req.user = currentUser;
        req.userType = decoded.type || 'customer'; // Useful for other middleware
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

        const table = decoded.type === 'admin' ? 'admins' : 'customers';
        const result = await query(`SELECT * FROM ${table} WHERE id = $1`, [decoded.id]);

        if (result.rows.length) {
            req.user = result.rows[0];
            if (decoded.type === 'customer' && !req.user.role) req.user.role = 'customer';
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
