import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUserFromRequest, hasRole } from '@/lib/auth';

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

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        await prisma.expense.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
    }
}
