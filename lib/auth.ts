import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { NextRequest } from 'next/server';
import { generateToken, verifyToken, TokenPayload } from './token';

export { generateToken, verifyToken, type TokenPayload };

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

// Hash password
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}


// Extract token from request
export function getTokenFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    return null;
}

// Verify user from request
export async function verifyUserFromRequest(request: NextRequest): Promise<TokenPayload | null> {
    const token = getTokenFromRequest(request);
    if (!token) return null;
    return verifyToken(token);
}

// Check if user has required role
export function hasRole(user: TokenPayload | null, allowedRoles: string[]): boolean {
    if (!user) return false;
    return allowedRoles.includes(user.role);
}
