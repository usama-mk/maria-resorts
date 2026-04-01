import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const adminPassword = await bcrypt.hash('M-Admin-9321!$', 10);
    await prisma.user.upsert({
        where: { email: 'admin@mariaresorts.com' },
        update: { password: adminPassword },
        create: {
            email: 'admin@mariaresorts.com',
            password: adminPassword,
            name: 'Administrator',
            role: 'ADMIN',
        }
    });

    const fdPassword = await bcrypt.hash('M-FrontDesk-7456!*', 10);
    await prisma.user.upsert({
        where: { email: 'frontdesk@mariaresorts.com' },
        update: { password: fdPassword },
        create: {
            email: 'frontdesk@mariaresorts.com',
            password: fdPassword,
            name: 'Front Desk',
            role: 'FRONTDESK',
        }
    });

    console.log("Passwords updated securely!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
