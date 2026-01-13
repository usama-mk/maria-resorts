import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/utils';

// GET all rooms with categories
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const categoryId = searchParams.get('categoryId');

        let where: any = {};
        if (status) where.status = status;
        if (categoryId) where.categoryId = categoryId;

        const rooms = await prisma.room.findMany({
            where,
            include: {
                category: true,
            },
            orderBy: { roomNumber: 'asc' },
        });

        return successResponse(rooms);
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to fetch rooms', 500);
    }
}

// POST create new room
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { roomNumber, categoryId, floor, status } = body;

        if (!roomNumber || !categoryId) {
            return errorResponse('Room number and category are required');
        }

        // Check if room number already exists
        const existing = await prisma.room.findUnique({
            where: { roomNumber },
        });

        if (existing) {
            return errorResponse('Room number already exists');
        }

        const room = await prisma.room.create({
            data: {
                roomNumber,
                categoryId,
                floor,
                status: status || 'AVAILABLE',
            },
            include: {
                category: true,
            },
        });

        // Audit log
        const userId = request.headers.get('x-user-id');
        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'CREATE_ROOM',
                    entityType: 'Room',
                    entityId: room.id,
                    newValue: JSON.stringify(room),
                },
            });
        }

        return successResponse(room, 'Room created successfully');
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to create room', 500);
    }
}

// PUT update room
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, roomNumber, categoryId, floor, status } = body;

        if (!id) {
            return errorResponse('Room ID is required');
        }

        const room = await prisma.room.update({
            where: { id },
            data: {
                roomNumber,
                categoryId,
                floor,
                status,
            },
            include: {
                category: true,
            },
        });

        // Audit log
        const userId = request.headers.get('x-user-id');
        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'UPDATE_ROOM',
                    entityType: 'Room',
                    entityId: room.id,
                    newValue: JSON.stringify(room),
                },
            });
        }

        return successResponse(room, 'Room updated successfully');
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to update room', 500);
    }
}
