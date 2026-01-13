import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Validation
        if (!email || !password) {
            return errorResponse('Email and password are required');
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return errorResponse('Invalid email or password', 401);
        }

        // Check if user is active
        if (!user.active) {
            return errorResponse('Account is deactivated', 401);
        }

        // Verify password
        const isValidPassword = await verifyPassword(password, user.password);
        if (!isValidPassword) {
            return errorResponse('Invalid email or password', 401);
        }

        // Generate JWT token
        const token = await generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'LOGIN',
                entityType: 'User',
                entityId: user.id,
            },
        });

        return successResponse(
            {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            },
            'Login successful'
        );
    } catch (error: any) {
        console.error('Login error:', error);
        return errorResponse(error.message || 'Failed to login', 500);
    }
}
