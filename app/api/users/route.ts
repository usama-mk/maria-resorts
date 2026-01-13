import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, forbiddenResponse } from '@/lib/utils';
import { hashPassword } from '@/lib/auth';

// GET all users (admin only)
export async function GET(request: NextRequest) {
    try {
        const userRole = request.headers.get('x-user-role');

        if (userRole !== 'ADMIN') {
            return forbiddenResponse('Only admins can view users');
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                active: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return successResponse(users);
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to fetch users', 500);
    }
}

// POST create new user (admin only)
export async function POST(request: NextRequest) {
    try {
        const userRole = request.headers.get('x-user-role');

        if (userRole !== 'ADMIN') {
            return forbiddenResponse('Only admins can create users');
        }

        const body = await request.json();
        const { email, password, name, role } = body;

        if (!email || !password || !name || !role) {
            return errorResponse('All fields are required');
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return errorResponse('User with this email already exists');
        }

        const hashedPassword = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                active: true,
            },
        });

        return successResponse(user, 'User created successfully');
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to create user', 500);
    }
}

// PUT update user (admin only)
export async function PUT(request: NextRequest) {
    try {
        const userRole = request.headers.get('x-user-role');

        if (userRole !== 'ADMIN') {
            return forbiddenResponse('Only admins can update users');
        }

        const body = await request.json();
        const { id, name, role, active } = body;

        if (!id) {
            return errorResponse('User ID is required');
        }

        const user = await prisma.user.update({
            where: { id },
            data: {
                name,
                role,
                active,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                active: true,
            },
        });

        return successResponse(user, 'User updated successfully');
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to update user', 500);
    }
}
