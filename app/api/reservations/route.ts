import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/utils';

// GET all reservations
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const guestId = searchParams.get('guestId');

        let where: any = {};
        if (status) where.status = status;
        if (guestId) where.guestId = guestId;

        const reservations = await prisma.reservation.findMany({
            where,
            include: {
                guest: true,
                room: {
                    include: {
                        category: true,
                    },
                },
            },
            orderBy: { checkInDate: 'desc' },
        });

        return successResponse(reservations);
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to fetch reservations', 500);
    }
}

// POST create new reservation
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            guestId,
            roomId,
            checkInDate,
            expectedCheckOut,
            advancePayment,
            notes,
        } = body;

        if (!guestId || !roomId || !checkInDate || !expectedCheckOut) {
            return errorResponse('Guest, room, check-in and check-out dates are required');
        }

        // Check if room is available
        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (!room) {
            return errorResponse('Room not found', 404);
        }

        if (room.status !== 'AVAILABLE') {
            return errorResponse('Room is not available');
        }

        // Create reservation
        const reservation = await prisma.reservation.create({
            data: {
                guestId,
                roomId,
                checkInDate: new Date(checkInDate),
                expectedCheckOut: new Date(expectedCheckOut),
                advancePayment: advancePayment || 0,
                notes,
                status: 'RESERVED',
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

        // Update room status to BOOKED
        await prisma.room.update({
            where: { id: roomId },
            data: { status: 'BOOKED' },
        });

        // Audit log
        const userId = request.headers.get('x-user-id');
        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'CREATE_RESERVATION',
                    entityType: 'Reservation',
                    entityId: reservation.id,
                    newValue: JSON.stringify(reservation),
                },
            });
        }

        return successResponse(reservation, 'Reservation created successfully');
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to create reservation', 500);
    }
}

// PUT update reservation (e.g., cancel)
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, status, notes } = body;

        if (!id) {
            return errorResponse('Reservation ID is required');
        }

        const oldReservation = await prisma.reservation.findUnique({
            where: { id },
            include: { room: true },
        });

        if (!oldReservation) {
            return errorResponse('Reservation not found', 404);
        }

        const reservation = await prisma.reservation.update({
            where: { id },
            data: {
                status: status || oldReservation.status,
                notes: notes || oldReservation.notes,
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

        // If cancelled, make room available again
        if (status === 'CANCELLED' && oldReservation.status !== 'CHECKED_IN') {
            await prisma.room.update({
                where: { id: oldReservation.roomId },
                data: { status: 'AVAILABLE' },
            });
        }

        // Audit log
        const userId = request.headers.get('x-user-id');
        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'UPDATE_RESERVATION',
                    entityType: 'Reservation',
                    entityId: reservation.id,
                    oldValue: JSON.stringify(oldReservation),
                    newValue: JSON.stringify(reservation),
                },
            });
        }

        return successResponse(reservation, 'Reservation updated successfully');
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to update reservation', 500);
    }
}
