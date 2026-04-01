import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUserFromRequest, hasRole } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const staff = await prisma.staff.findUnique({
            where: { id },
            include: {
                transactions: {
                    orderBy: { date: 'desc' }
                }
            }
        });

        if (!staff) {
            return NextResponse.json(
                { error: "Staff member not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(staff);
    } catch (error) {
        console.error("Error fetching staff:", error);
        return NextResponse.json(
            { error: "Failed to fetch staff" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await verifyUserFromRequest(request as any);
        if (!hasRole(authUser, ['ADMIN'])) {
            return NextResponse.json({ error: 'Admin permission required to make changes' }, { status: 403 });
        }
        const { id } = await params;
        const body = await request.json();
        const { name, position, salary } = body;

        const updatedStaff = await prisma.staff.update({
            where: { id },
            data: {
                name,
                position,
                salary: salary !== undefined ? parseFloat(salary) : undefined,
            },
        });

        return NextResponse.json(updatedStaff);
    } catch (error) {
        console.error("Error updating staff:", error);
        return NextResponse.json(
            { error: "Failed to update staff" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await verifyUserFromRequest(request as any);
        if (!hasRole(authUser, ['ADMIN'])) {
            return NextResponse.json({ error: 'Admin permission required to make changes' }, { status: 403 });
        }
        const { id } = await params;
        await prisma.staff.delete({
            where: { id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting staff:", error);
        return NextResponse.json(
            { error: "Failed to delete staff" },
            { status: 500 }
        );
    }
}
