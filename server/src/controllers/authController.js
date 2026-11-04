import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const { JWT_SECRET, NODE_ENV } = process.env;

const BCRYPT_COST = 10;
const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'lax',
    secure: NODE_ENV === 'production',
    path: '/',
};

const USERNAME_PATTERN = /^[A-Za-z0-9_-]{3,30}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72;

function httpError(status, message) {
    return Object.assign(new Error(message), { status });
}

function normalizeEmail(email) {
    return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function validateRegistration(username, email, password) {
    if (!USERNAME_PATTERN.test(username)) {
        return 'Username must be 3-30 letters, numbers, hyphens or underscores';
    }
    if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
        return 'Enter a valid email address';
    }
    if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
        return 'Password must be at least 8 characters';
    }
    if (Buffer.byteLength(password) > PASSWORD_MAX_BYTES) {
        return 'Password is too long';
    }
    return null;
}

function toPublicUser(user) {
    return { id: user.id, username: user.username, email: user.email };
}

function setAuthCookie(res, user) {
    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie(COOKIE_NAME, token, { ...COOKIE_OPTIONS, maxAge: COOKIE_MAX_AGE_MS });
}

export async function register(req, res) {
    const body = req.body ?? {};
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const email = normalizeEmail(body.email);
    const { password } = body;

    const problem = validateRegistration(username, email, password);
    if (problem) {
        throw httpError(400, problem);
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    let user;
    try {
        user = await User.create({ username, email, passwordHash });
    } catch (err) {
        if (err.code === 11000) {
            throw httpError(
                409,
                err.keyPattern?.email ? 'An account with that email already exists' : 'That username is taken',
            );
        }
        throw err;
    }

    setAuthCookie(res, user);
    res.status(201).json({ user: toPublicUser(user) });
}

export async function login(req, res) {
    const body = req.body ?? {};
    const email = normalizeEmail(body.email);
    const { password } = body;

    if (!email || typeof password !== 'string' || !password) {
        throw httpError(400, 'Email and password are required');
    }

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        throw httpError(401, 'Invalid email or password');
    }

    setAuthCookie(res, user);
    res.json({ user: toPublicUser(user) });
}

export function logout(req, res) {
    res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
    res.status(204).end();
}
