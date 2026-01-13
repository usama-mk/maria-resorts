import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/utils';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';

// GET financial reports
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'daily', 'monthly', 'overall', 'occupancy'
        const date = searchParams.get('date'); // For specific date/month

        const targetDate = date ? new Date(date) : new Date();

        if (type === 'daily') {
            const dayStart = startOfDay(targetDate);
            const dayEnd = endOfDay(targetDate);

            const bills = await prisma.bill.findMany({
                where: {
                    generatedAt: {
                        gte: dayStart,
                        lte: dayEnd,
                    },
                },
                include: {
                    items: true,
                    payments: true,
                },
            });

            const totalRevenue = bills.reduce((sum, bill) => sum + bill.total, 0);
            const totalPaid = bills
                .flatMap(bill => bill.payments)
                .reduce((sum, payment) => sum + payment.amount, 0);
            const pending = totalRevenue - totalPaid;

            // Breakdown by type
            const roomRevenue = bills.reduce((sum, bill) => {
                return sum + bill.items
                    .filter(item => item.type === 'ROOM')
                    .reduce((s, item) => s + item.total, 0);
            }, 0);

            const foodRevenue = bills.reduce((sum, bill) => {
                return sum + bill.items
                    .filter(item => item.type === 'FOOD')
                    .reduce((s, item) => s + item.total, 0);
            }, 0);

            const serviceRevenue = bills.reduce((sum, bill) => {
                return sum + bill.items
                    .filter(item => item.type === 'SERVICE')
                    .reduce((s, item) => s + item.total, 0);
            }, 0);

            return successResponse({
                date: targetDate,
                totalRevenue,
                totalPaid,
                pending,
                breakdown: {
                    room: roomRevenue,
                    food: foodRevenue,
                    service: serviceRevenue,
                },
                billCount: bills.length,
            });
        }

        if (type === 'monthly') {
            const monthStart = startOfMonth(targetDate);
            const monthEnd = endOfMonth(targetDate);

            const bills = await prisma.bill.findMany({
                where: {
                    generatedAt: {
                        gte: monthStart,
                        lte: monthEnd,
                    },
                },
                include: {
                    items: true,
                    payments: true,
                },
            });

            const totalRevenue = bills.reduce((sum, bill) => sum + bill.total, 0);
            const totalPaid = bills
                .flatMap(bill => bill.payments)
                .reduce((sum, payment) => sum + payment.amount, 0);
            const pending = totalRevenue - totalPaid;

            const roomRevenue = bills.reduce((sum, bill) => {
                return sum + bill.items
                    .filter(item => item.type === 'ROOM')
                    .reduce((s, item) => s + item.total, 0);
            }, 0);

            const foodRevenue = bills.reduce((sum, bill) => {
                return sum + bill.items
                    .filter(item => item.type === 'FOOD')
                    .reduce((s, item) => s + item.total, 0);
            }, 0);

            const serviceRevenue = bills.reduce((sum, bill) => {
                return sum + bill.items
                    .filter(item => item.type === 'SERVICE')
                    .reduce((s, item) => s + item.total, 0);
            }, 0);

            return successResponse({
                month: targetDate,
                totalRevenue,
                totalPaid,
                pending,
                breakdown: {
                    room: roomRevenue,
                    food: foodRevenue,
                    service: serviceRevenue,
                },
                billCount: bills.length,
            });
        }

        if (type === 'overall') {
            const bills = await prisma.bill.findMany({
                include: {
                    items: true,
                    payments: true,
                },
            });

            const totalRevenue = bills.reduce((sum, bill) => sum + bill.total, 0);
            const totalPaid = bills
                .flatMap(bill => bill.payments)
                .reduce((sum, payment) => sum + payment.amount, 0);
            const pending = totalRevenue - totalPaid;

            const roomRevenue = bills.reduce((sum, bill) => {
                return sum + bill.items
                    .filter(item => item.type === 'ROOM')
                    .reduce((s, item) => s + item.total, 0);
            }, 0);

            const foodRevenue = bills.reduce((sum, bill) => {
                return sum + bill.items
                    .filter(item => item.type === 'FOOD')
                    .reduce((s, item) => s + item.total, 0);
            }, 0);

            const serviceRevenue = bills.reduce((sum, bill) => {
                return sum + bill.items
                    .filter(item => item.type === 'SERVICE')
                    .reduce((s, item) => s + item.total, 0);
            }, 0);

            // Vendor expenses
            const vendorExpenses = await prisma.vendorTransaction.findMany({
                where: {
                    type: 'BILL_RECEIVED',
                },
            });

            const totalExpenses = vendorExpenses.reduce((sum, expense) => sum + expense.amount, 0);
            const netProfit = totalRevenue - totalExpenses;

            return successResponse({
                totalRevenue,
                totalPaid,
                pending,
                totalExpenses,
                netProfit,
                breakdown: {
                    room: roomRevenue,
                    food: foodRevenue,
                    service: serviceRevenue,
                },
                billCount: bills.length,
            });
        }

        if (type === 'occupancy') {
            const rooms = await prisma.room.findMany();
            const totalRooms = rooms.length;
            const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED').length;
            const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

            // Check-ins today
            const dayStart = startOfDay(new Date());
            const dayEnd = endOfDay(new Date());

            const checkInsToday = await prisma.checkIn.count({
                where: {
                    checkInTime: {
                        gte: dayStart,
                        lte: dayEnd,
                    },
                },
            });

            const checkOutsToday = await prisma.checkIn.count({
                where: {
                    actualCheckOut: {
                        gte: dayStart,
                        lte: dayEnd,
                    },
                },
            });

            return successResponse({
                totalRooms,
                occupiedRooms,
                availableRooms: rooms.filter(r => r.status === 'AVAILABLE').length,
                occupancyRate,
                checkInsToday,
                checkOutsToday,
            });
        }

        return errorResponse('Invalid report type');
    } catch (error: any) {
        return errorResponse(error.message || 'Failed to generate report', 500);
    }
}
