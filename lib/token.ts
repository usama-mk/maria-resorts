import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    [key: string]: any; // Allow minimal extra props
}

// Generate JWT token (Edge compatible)
export async function generateToken(payload: TokenPayload): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secretKey);
}

// Verify JWT token (Edge compatible)
export async function verifyToken(token: string): Promise<TokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secretKey);
        return payload as unknown as TokenPayload;
    } catch (error) {
        return null;
    }
}
