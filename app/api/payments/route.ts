import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/utils';

// POST record payment
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        let { billId, amount, paymentMethod, notes, method } = body;

        // Support 'method' alias for paymentMethod
        if (!paymentMethod && method) {
            paymentMethod = method;
        }

        if (!billId || !amount || !paymentMethod) {
            return errorResponse('Bill ID, amount, and payment method are required');
        }

        const bill = await prisma.bill.findUnique({
            where: { id: billId },
            include: { payments: true },
        });

        if (!bill) {
            return errorResponse('Bill not found', 404);
        }

        // Create payment
        const payment = await prisma.payment.create({
            data: {
                billId,
                amount,
                paymentMethod,
                notes,
            },
        });

        // Calculate total paid
        const allPayments = await prisma.payment.findMany({
            where: { billId },
        });

        const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

        // Update bill status
        let status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' = 'UNPAID';
        if (totalPaid >= bill.total) {
            status = 'PAID';
        } else if (totalPaid > 0) {
            status = 'PARTIALLY_PAID';
        }

        await prisma.bill.update({
            where: { id: billId },
            data: { status },
        });

        // Audit log
        const userId = request.headers.get('x-user-id');
        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'RECORD_PAYMENT',
                    entityType: 'Payment',
                    entityId: payment.id,
                    newValue: JSON.stringify({ payment, totalPaid, status }),
                },
            });
        }

        return successResponse(
            { payment, totalPaid, remaining: bill.total - totalPaid, status },
            'Payment recorded successfully'
        );
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to record payment', 500);
    }
}

// GET payments for a bill
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const billId = searchParams.get('billId');

        if (!billId) {
            return errorResponse('Bill ID is required');
        }

        const payments = await prisma.payment.findMany({
            where: { billId },
            orderBy: { paymentDate: 'desc' },
        });

        const bill = await prisma.bill.findUnique({
            where: { id: billId },
        });

        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = bill ? bill.total - totalPaid : 0;

        return successResponse({ payments, totalPaid, remaining });
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to fetch payments', 500);
    }
}
