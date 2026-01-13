import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, name, role } = body;

        // Validation
        if (!email || !password || !name) {
            return errorResponse('Email, password, and name are required');
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return errorResponse('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || 'FRONTDESK',
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                active: true,
            },
        });

        return successResponse(user, 'User registered successfully');
    } catch (error: any) {
        console.error('Register error:', error);
        return errorResponse(error.message || 'Failed to register user', 500);
    }
}
