import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/utils';
import { calculateRoomCharges, calculateLateCharges } from '@/lib/utils';

// GET all check-ins
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const active = searchParams.get('active');

        let where: any = {};
        if (active === 'true') {
            where.actualCheckOut = null; // Still checked in
        }

        const checkIns = await prisma.checkIn.findMany({
            where,
            include: {
                guest: true,
                room: {
                    include: {
                        category: true,
                    },
                },
                reservation: true,
            },
            orderBy: { checkInTime: 'desc' },
        });

        return successResponse(checkIns);
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to fetch check-ins', 500);
    }
}

// POST check-in guest
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        let { reservationId, guestId, roomId, expectedCheckOut } = body;

        // Sanitize reservationId (convert empty string to null)
        if (reservationId === '') reservationId = null;

        // If reservation is provided, fetch details
        if (reservationId) {
            const reservation = await prisma.reservation.findUnique({
                where: { id: reservationId },
            });

            if (!reservation) {
                return errorResponse('Reservation not found', 404);
            }

            // Auto-fill missing fields from reservation
            if (!guestId) guestId = reservation.guestId;
            if (!roomId) roomId = reservation.roomId;
            if (!expectedCheckOut) expectedCheckOut = reservation.checkOut;
        }

        if (!guestId || !roomId || !expectedCheckOut) {
            return errorResponse('Guest, room, and expected checkout date are required');
        }

        // Verify room is available
        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (!room) {
            return errorResponse('Room not found', 404);
        }

        // Allow check-in if room is reserved for THIS reservation
        // If it's occupied by someone else, block it.
        // We need to check if the current occupant is different.
        // For simplicity, sticking to status check but considering 'RESERVED' as valid for check-in.
        if (room.status === 'OCCUPIED' || room.status === 'MAINTENANCE') {
            return errorResponse(`Room is ${room.status.toLowerCase()}`);
        }

        // Create check-in
        const checkIn = await prisma.checkIn.create({
            data: {
                reservationId,
                guestId,
                roomId,
                expectedCheckOut: new Date(expectedCheckOut),
            },
            include: {
                guest: true,
                room: {
                    include: {
                        category: true,
                    },
                },
            },
        });

        // Update room status to OCCUPIED
        await prisma.room.update({
            where: { id: roomId },
            data: { status: 'OCCUPIED' },
        });

        // Update reservation status if exists
        if (reservationId) {
            await prisma.reservation.update({
                where: { id: reservationId },
                data: { status: 'CHECKED_IN' },
            });
        }

        // Audit log
        const userId = request.headers.get('x-user-id');
        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'CHECK_IN',
                    entityType: 'CheckIn',
                    entityId: checkIn.id,
                    newValue: JSON.stringify(checkIn),
                },
            });
        }

        return successResponse(checkIn, 'Guest checked in successfully');
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to check in', 500);
    }
}

// PUT check-out guest
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return errorResponse('Check-in ID is required');
        }

        const checkIn = await prisma.checkIn.findUnique({
            where: { id },
            include: {
                room: {
                    include: {
                        category: true,
                    },
                },
            },
        });

        if (!checkIn) {
            return errorResponse('Check-in record not found', 404);
        }

        if (checkIn.actualCheckOut) {
            return errorResponse('Guest already checked out');
        }

        const now = new Date();
        const isLate = now > checkIn.expectedCheckOut;
        const lateCharges = isLate
            ? calculateLateCharges(checkIn.expectedCheckOut, now, checkIn.room.category.basePrice)
            : 0;

        // Update check-in with checkout time
        const updatedCheckIn = await prisma.checkIn.update({
            where: { id },
            data: {
                actualCheckOut: now,
                lateCheckout: isLate,
                lateCharges,
            },
            include: {
                guest: true,
                room: {
                    include: {
                        category: true,
                    },
                },
            },
        });

        // Update room status to CLEANING
        await prisma.room.update({
            where: { id: checkIn.roomId },
            data: { status: 'CLEANING' },
        });

        // Update reservation if exists
        if (checkIn.reservationId) {
            await prisma.reservation.update({
                where: { id: checkIn.reservationId },
                data: { status: 'CHECKED_OUT' },
            });
        }

        // Audit log
        const userId = request.headers.get('x-user-id');
        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'CHECK_OUT',
                    entityType: 'CheckIn',
                    entityId: updatedCheckIn.id,
                    newValue: JSON.stringify(updatedCheckIn),
                },
            });
        }

        return successResponse(updatedCheckIn, 'Guest checked out successfully');
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to check out', 500);
    }
}
