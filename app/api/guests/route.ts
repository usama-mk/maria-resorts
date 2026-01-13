import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/utils';

// GET all guests or search
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        let guests;

        if (search) {
            guests = await prisma.guest.findMany({
                where: {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { phone: { contains: search } },
                        { cnic: { contains: search } },
                        { passport: { contains: search } },
                    ],
                },
                orderBy: { createdAt: 'desc' },
            });
        } else {
            guests = await prisma.guest.findMany({
                orderBy: { createdAt: 'desc' },
                take: 100,
            });
        }

        return successResponse(guests);
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to fetch guests', 500);
    }
}

// POST create new guest
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, cnic, passport, phone, email, address } = body;

        // Validation
        if (!name || !phone) {
            return errorResponse('Name and phone are required');
        }

        // Check for duplicate CNIC or passport
        if (cnic) {
            const existing = await prisma.guest.findUnique({ where: { cnic } });
            if (existing) {
                return errorResponse('Guest with this CNIC already exists');
            }
        }

        if (passport) {
            const existing = await prisma.guest.findUnique({ where: { passport } });
            if (existing) {
                return errorResponse('Guest with this passport already exists');
            }
        }

        const guest = await prisma.guest.create({
            data: { name, cnic, passport, phone, email, address },
        });

        // Audit log
        const userId = request.headers.get('x-user-id');
        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'CREATE_GUEST',
                    entityType: 'Guest',
                    entityId: guest.id,
                    newValue: JSON.stringify(guest),
                },
            });
        }

        return successResponse(guest, 'Guest created successfully');
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to create guest', 500);
    }
}

// PUT update guest
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, cnic, passport, phone, email, address } = body;

        if (!id) {
            return errorResponse('Guest ID is required');
        }

        const oldGuest = await prisma.guest.findUnique({ where: { id } });
        if (!oldGuest) {
            return errorResponse('Guest not found', 404);
        }

        const guest = await prisma.guest.update({
            where: { id },
            data: { name, cnic, passport, phone, email, address },
        });

        // Audit log
        const userId = request.headers.get('x-user-id');
        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'UPDATE_GUEST',
                    entityType: 'Guest',
                    entityId: guest.id,
                    oldValue: JSON.stringify(oldGuest),
                    newValue: JSON.stringify(guest),
                },
            });
        }

        return successResponse(guest, 'Guest updated successfully');
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to update guest', 500);
    }
}
