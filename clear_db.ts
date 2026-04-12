import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting transactional data wipe for fresh resort launch...');

    await prisma.$transaction([
        // First remove dependencies
        prisma.billItem.deleteMany(),
        prisma.payment.deleteMany(),

        // Then bills and checkins
        prisma.bill.deleteMany(),
        prisma.checkIn.deleteMany(),

        // Then reservations and guests
        prisma.reservation.deleteMany(),
        prisma.guest.deleteMany(),

        // Other operational ledgers
        prisma.expense.deleteMany(),
        prisma.vendorTransaction.deleteMany(),
        prisma.staffTransaction.deleteMany(),
        prisma.auditLog.deleteMany(),

        prisma.staff.updateMany({
            data: { balance: 0 }
        }),

        // Reset room statuses to AVAILABLE
        prisma.room.updateMany({
            data: { status: 'AVAILABLE' }
        }),

        // Ensure all menu items and services are marked as available
        prisma.foodMenuItem.updateMany({
            data: { available: true }
        }),
        prisma.extraService.updateMany({
            data: { available: true }
        })
    ]);

    console.log('✅ Database successfully cleared for a fresh start!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
