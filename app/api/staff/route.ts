import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const staff = await prisma.staff.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(staff);
    } catch (error) {
        console.error("Error fetching staff:", error);
        return NextResponse.json(
            { error: "Failed to fetch staff" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, position, salary, balance } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Staff name is required" },
                { status: 400 }
            );
        }

        const newStaff = await prisma.staff.create({
            data: {
                name,
                position: position || null,
                salary: salary ? parseFloat(salary) : 0,
                balance: balance ? parseFloat(balance) : 0,
            },
        });

        return NextResponse.json(newStaff, { status: 201 });
    } catch (error) {
        console.error("Error creating staff:", error);
        return NextResponse.json(
            { error: "Failed to create staff" },
            { status: 500 }
        );
    }
}
