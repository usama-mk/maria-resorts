import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const transactions = await prisma.staffTransaction.findMany({
            where: { staffId: id },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json(transactions);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json(
            { error: "Failed to fetch transactions" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        const body = await request.json();
        const { type, amount, description, date } = body;

        if (!type || !amount) {
            return NextResponse.json(
                { error: "Type and amount are required" },
                { status: 400 }
            );
        }

        const transactionAmount = parseFloat(amount);

        // Use a transaction to ensure all db operations succeed or fail together
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the staff transaction
            const transaction = await tx.staffTransaction.create({
                data: {
                    staffId: id,
                    type,
                    amount: transactionAmount,
                    description,
                    date: date ? new Date(date) : new Date(),
                },
            });

            // 2. Update the staff balance
            const staff = await tx.staff.update({
                where: { id },
                data: {
                    balance: {
                        [type === 'SALARY_DUE' ? 'increment' : 'decrement']: transactionAmount
                    }
                }
            });

            // 3. If it's a PAYMENT, create an Expense
            if (type === 'PAYMENT') {
                await tx.expense.create({
                    data: {
                        category: "Staff Salary",
                        amount: transactionAmount,
                        description: description
                            ? `Paid to ${staff.name} - ${description}`
                            : `Paid to ${staff.name}`,
                        paymentMethod: "CASH", // Default payment method
                        date: date ? new Date(date) : new Date(),
                    }
                });
            }

            return transaction;
        });

        // Generate response
        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error("Error creating transaction:", error);
        return NextResponse.json(
            {
                error: "Failed to create transaction",
                details: error?.message || String(error)
            },
            { status: 500 }
        );
    }
}
