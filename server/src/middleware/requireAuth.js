import jwt from 'jsonwebtoken';
import { httpError } from './errorHandler.js';

const { JWT_SECRET } = process.env;

export function requireAuth(req, res, next) {
    let payload;
    try {
        payload = jwt.verify(req.cookies.token, JWT_SECRET);
    } catch {
        throw httpError(401, 'Not authenticated');
    }

    req.userId = payload.sub;
    next();
}
