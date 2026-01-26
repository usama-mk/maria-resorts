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
                bills: true,
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
        let { reservationId, guestId, roomId, expectedCheckOut, customPrice, advancePayment } = body;

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
            // Use reservation advance payment if not overridden
            if (advancePayment === undefined && reservation.advancePayment) {
                advancePayment = reservation.advancePayment;
            }
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
                customRate: customPrice ? parseFloat(customPrice) : null,
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

        // CREATE BILL IMMEDIATELY
        const bill = await prisma.bill.create({
            data: {
                billNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                guestId: guestId,
                checkInId: checkIn.id,
                subtotal: 0,
                tax: 0,
                total: 0,
                status: 'UNPAID', // Will update if advance payment covers it (unlikely at start)
            },
        });

        // Record Advance Payment if any
        if (advancePayment && parseFloat(advancePayment) > 0) {
            const amount = parseFloat(advancePayment);
            await prisma.payment.create({
                data: {
                    billId: bill.id,
                    amount: amount,
                    paymentMethod: 'CASH', // Default for advance, or add field to form
                    notes: 'Advance Payment at Check-in',
                },
            });

            // Update bill status to PARTIALLY_PAID (even if 0 total, getting money means partial credits? 
            // Actually total is 0 right now, so if we pay, we are overpaying?
            // Let's just mark it PARTIALLY_PAID because the final bill will be larger.
            await prisma.bill.update({
                where: { id: bill.id },
                data: { status: 'PARTIALLY_PAID' },
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

        return successResponse({ ...checkIn, billId: bill.id }, 'Guest checked in successfully');
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

        // Update room status to AVAILABLE immediately (skip CLEANING for now as per user request)
        await prisma.room.update({
            where: { id: checkIn.roomId },
            data: { status: 'AVAILABLE' },
        });

        // Update reservation if exists
        if (checkIn.reservationId) {
            await prisma.reservation.update({
                where: { id: checkIn.reservationId },
                data: { status: 'CHECKED_OUT' },
            });
        }

        // Find existing Bill
        let bill = await prisma.bill.findFirst({
            where: { checkInId: updatedCheckIn.id },
        });

        // Fallback: Create bill if missing (legacy support)
        if (!bill) {
            bill = await prisma.bill.create({
                data: {
                    billNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    guestId: updatedCheckIn.guestId,
                    checkInId: updatedCheckIn.id,
                    subtotal: 0,
                    tax: 0,
                    total: 0,
                    status: 'UNPAID',
                },
            });
        }

        // Calculate Room Charges (Use Custom Rate if available)
        const nights = Math.max(1, Math.ceil((new Date(updatedCheckIn.actualCheckOut || new Date()).getTime() - new Date(updatedCheckIn.checkInTime).getTime()) / (1000 * 60 * 60 * 24)));
        const pricePerNight = updatedCheckIn.customRate ?? updatedCheckIn.room.category.basePrice;
        const roomCharges = nights * pricePerNight;
        const rateDescription = updatedCheckIn.customRate ? ` (Custom Rate: ${updatedCheckIn.customRate})` : '';

        // Add Room Charge Item
        await prisma.billItem.create({
            data: {
                billId: bill.id,
                type: 'ROOM',
                description: `${updatedCheckIn.room.category.name} - Room ${updatedCheckIn.room.roomNumber} (${nights} night${nights > 1 ? 's' : ''})${rateDescription}`,
                quantity: nights,
                unitPrice: pricePerNight,
                total: roomCharges,
                roomId: updatedCheckIn.roomId,
            },
        });

        // Add Late Checkout Charge Item if applicable
        if (updatedCheckIn.lateCheckout && updatedCheckIn.lateCharges > 0) {
            await prisma.billItem.create({
                data: {
                    billId: bill.id,
                    type: 'OTHER',
                    description: 'Late Checkout Charges',
                    quantity: 1,
                    unitPrice: updatedCheckIn.lateCharges,
                    total: updatedCheckIn.lateCharges,
                },
            });
        }

        // Calculate Totals
        const items = await prisma.billItem.findMany({ where: { billId: bill.id } });
        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const tax = subtotal * 0.05; // 5% Tax
        const total = subtotal + tax;

        // Check Payment Status
        const payments = await prisma.payment.findMany({ where: { billId: bill.id } });
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

        let status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' = 'UNPAID';
        if (totalPaid >= total) status = 'PAID';
        else if (totalPaid > 0) status = 'PARTIALLY_PAID';

        await prisma.bill.update({
            where: { id: bill.id },
            data: { subtotal, tax, total, status },
        });

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
