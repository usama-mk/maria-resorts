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

        // Reset staff balances to 0
        prisma.staff.updateMany({
            data: { balance: 0 }
        })
    ]);

    console.log('✅ Database successfully cleared for a fresh start!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
