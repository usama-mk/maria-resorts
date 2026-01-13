import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/utils';

// GET all vendors
export async function GET(request: NextRequest) {
    try {
        const vendors = await prisma.vendor.findMany({
            include: {
                _count: {
                    select: { transactions: true },
                },
            },
            orderBy: { name: 'asc' },
        });

        return successResponse(vendors);
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to fetch vendors', 500);
    }
}

// POST create vendor or transaction
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, vendorId, name, contactPerson, phone, email, address, services, amount, description, transactionType } = body;

        if (type === 'vendor') {
            const vendor = await prisma.vendor.create({
                data: {
                    name,
                    contactPerson,
                    phone,
                    email,
                    address,
                    services,
                },
            });

            return successResponse(vendor, 'Vendor created successfully');
        }

        if (type === 'transaction') {
            if (!vendorId || !amount || !description || !transactionType) {
                return errorResponse('Vendor, amount, description, and type are required');
            }

            const transaction = await prisma.vendorTransaction.create({
                data: {
                    vendorId,
                    type: transactionType,
                    amount,
                    description,
                    paymentStatus: transactionType === 'BILL_RECEIVED' ? 'UNPAID' : 'PAID',
                },
                include: {
                    vendor: true,
                },
            });

            // Audit log
            const userId = request.headers.get('x-user-id');
            if (userId) {
                await prisma.auditLog.create({
                    data: {
                        userId,
                        action: 'CREATE_VENDOR_TRANSACTION',
                        entityType: 'VendorTransaction',
                        entityId: transaction.id,
                        newValue: JSON.stringify(transaction),
                    },
                });
            }

            return successResponse(transaction, 'Transaction recorded successfully');
        }

        return errorResponse('Invalid type');
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to create', 500);
    }
}

// PUT update vendor or mark transaction as paid
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, id, paymentStatus } = body;

        if (type === 'transaction' && id && paymentStatus) {
            const transaction = await prisma.vendorTransaction.update({
                where: { id },
                data: { paymentStatus },
                include: {
                    vendor: true,
                },
            });

            return successResponse(transaction, 'Transaction updated successfully');
        }

        if (type === 'vendor' && id) {
            const { name, contactPerson, phone, email, address, services } = body;

            const vendor = await prisma.vendor.update({
                where: { id },
                data: { name, contactPerson, phone, email, address, services },
            });

            return successResponse(vendor, 'Vendor updated successfully');
        }

        return errorResponse('Invalid request');
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to update', 500);
    }
}
