import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/utils';
import { generateBillNumber, calculateRoomCharges, calculateTax } from '@/lib/utils';

// GET all bills or search
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const guestId = searchParams.get('guestId');
        const billNumber = searchParams.get('billNumber');
        const status = searchParams.get('status');

        let where: any = {};
        if (id) where.id = id;
        if (guestId) where.guestId = guestId;
        if (billNumber) where.billNumber = billNumber;
        if (status) where.status = status;

        const bills = await prisma.bill.findMany({
            where,
            include: {
                guest: true,
                checkIn: {
                    include: {
                        room: {
                            include: {
                                category: true,
                            },
                        },
                    },
                },
                items: {
                    include: {
                        room: { include: { category: true } },
                        food: true,
                        service: true,
                    },
                },
                payments: true,
            },
            orderBy: { generatedAt: 'desc' },
        });

        return successResponse(bills);
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to fetch bills', 500);
    }
}

// POST create/generate bill
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { guestId, checkInId } = body;

        if (!guestId) {
            return errorResponse('Guest ID is required');
        }

        // Get check-in details if provided
        let checkIn = null;
        if (checkInId) {
            checkIn = await prisma.checkIn.findUnique({
                where: { id: checkInId },
                include: {
                    room: {
                        include: {
                            category: true,
                        },
                    },
                },
            });

            if (!checkIn) {
                return errorResponse('Check-in not found', 404);
            }
        }

        // Generate unique bill number
        const billNumber = generateBillNumber();

        // Create bill
        const bill = await prisma.bill.create({
            data: {
                billNumber,
                guestId,
                checkInId,
                subtotal: 0,
                tax: 0,
                total: 0,
                status: 'UNPAID',
            },
        });

        // If check-in exists, auto-add room charges
        if (checkIn) {
            const nights = Math.max(
                1,
                Math.ceil(
                    (new Date(checkIn.actualCheckOut || new Date()).getTime() -
                        new Date(checkIn.checkInTime).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
            );

            const roomCharges = nights * checkIn.room.category.basePrice;

            await prisma.billItem.create({
                data: {
                    billId: bill.id,
                    type: 'ROOM',
                    description: `${checkIn.room.category.name} - Room ${checkIn.room.roomNumber} (${nights} night${nights > 1 ? 's' : ''})`,
                    quantity: nights,
                    unitPrice: checkIn.room.category.basePrice,
                    total: roomCharges,
                    roomId: checkIn.roomId,
                },
            });

            // Add late checkout charges if applicable
            if (checkIn.lateCheckout && checkIn.lateCharges > 0) {
                await prisma.billItem.create({
                    data: {
                        billId: bill.id,
                        type: 'OTHER',
                        description: 'Late Checkout Charges',
                        quantity: 1,
                        unitPrice: checkIn.lateCharges,
                        total: checkIn.lateCharges,
                    },
                });
            }

            // Recalculate totals
            const items = await prisma.billItem.findMany({
                where: { billId: bill.id },
            });

            const subtotal = items.reduce((sum, item) => sum + item.total, 0);
            const tax = calculateTax(subtotal);
            const total = subtotal + tax;

            await prisma.bill.update({
                where: { id: bill.id },
                data: { subtotal, tax, total },
            });
        }

        const fullBill = await prisma.bill.findUnique({
            where: { id: bill.id },
            include: {
                guest: true,
                checkIn: {
                    include: {
                        room: {
                            include: {
                                category: true,
                            },
                        },
                    },
                },
                items: {
                    include: {
                        room: { include: { category: true } },
                        food: true,
                        service: true,
                    },
                },
                payments: true,
            },
        });

        // Audit log
        const userId = request.headers.get('x-user-id');
        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'GENERATE_BILL',
                    entityType: 'Bill',
                    entityId: bill.id,
                    newValue: JSON.stringify(fullBill),
                },
            });
        }

        return successResponse(fullBill, 'Bill generated successfully');
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to generate bill', 500);
    }
}

// PUT add item to bill or update bill
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { billId, type, description, quantity, unitPrice, foodId, serviceId } = body;

        if (!billId) {
            return errorResponse('Bill ID is required');
        }

        const bill = await prisma.bill.findUnique({ where: { id: billId } });
        if (!bill) {
            return errorResponse('Bill not found', 404);
        }

        // Add item to bill
        if (type && description && quantity && unitPrice) {
            await prisma.billItem.create({
                data: {
                    billId,
                    type,
                    description,
                    quantity,
                    unitPrice,
                    total: quantity * unitPrice,
                    foodId,
                    serviceId,
                },
            });
        }

        // Recalculate totals
        const items = await prisma.billItem.findMany({
            where: { billId },
        });

        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const tax = calculateTax(subtotal);
        const total = subtotal + tax;

        const updatedBill = await prisma.bill.update({
            where: { id: billId },
            data: { subtotal, tax, total },
            include: {
                guest: true,
                items: {
                    include: {
                        food: true,
                        service: true,
                    },
                },
                payments: true,
            },
        });

        return successResponse(updatedBill, 'Bill updated successfully');
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to update bill', 500);
    }
}
