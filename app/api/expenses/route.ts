import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        const whereClause: any = {};

        if (startDateParam && endDateParam) {
            const startDate = new Date(startDateParam);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(endDateParam);
            endDate.setHours(23, 59, 59, 999);

            whereClause.date = {
                gte: startDate,
                lte: endDate,
            };
        }

        const expenses = await prisma.expense.findMany({
            where: whereClause,
            orderBy: {
                date: 'desc',
            },
        });
        return NextResponse.json(expenses);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { category, amount, description, date, paymentMethod } = body;

        if (!category || !amount || !date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const expense = await prisma.expense.create({
            data: {
                category,
                amount: parseFloat(amount),
                description,
                paymentMethod: paymentMethod || 'CASH',
                date: new Date(date),
            },
        });

        return NextResponse.json(expense);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
    }
}
