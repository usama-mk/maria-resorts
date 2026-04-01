import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const categories = [
    { name: 'Standard', basePrice: 5000 },
    { name: 'Family Room', basePrice: 8000 },
    { name: 'Executive Suite Room', basePrice: 15000 },
    { name: 'Deluxe Room', basePrice: 10000 }
];

// Re-map simple "Standard" naming convention to match exactly
const rooms = [
    { roomNumber: '201', type: 'Family Room', floor: 1 },
    { roomNumber: '202', type: 'Family Room', floor: 1 },
    { roomNumber: '203', type: 'Executive Suite Room', floor: 1 },
    { roomNumber: '204', type: 'Executive Suite Room', floor: 1 },
    { roomNumber: '205', type: 'Deluxe Room', floor: 1 },
    { roomNumber: '206', type: 'Deluxe Room', floor: 1 },
    { roomNumber: '207', type: 'Deluxe Room', floor: 1 },
    { roomNumber: '208', type: 'Deluxe Room', floor: 1 },
    { roomNumber: '209', type: 'Executive Suite Room', floor: 1 },
    { roomNumber: '210', type: 'Executive Suite Room', floor: 1 },
    { roomNumber: '211', type: 'Family Room', floor: 1 },
    { roomNumber: '212', type: 'Standard Room', floor: 1 },

    { roomNumber: '301', type: 'Deluxe Room', floor: 2 },
    { roomNumber: '302', type: 'Deluxe Room', floor: 2 },
    { roomNumber: '303', type: 'Executive Suite Room', floor: 2 },
    { roomNumber: '304', type: 'Executive Suite Room', floor: 2 },
    { roomNumber: '305', type: 'Deluxe Room', floor: 2 },
    { roomNumber: '306', type: 'Deluxe Room', floor: 2 },
    { roomNumber: '307', type: 'Deluxe Room', floor: 2 },
    { roomNumber: '308', type: 'Deluxe Room', floor: 2 },
    { roomNumber: '309', type: 'Executive Suite Room', floor: 2 },
    { roomNumber: '310', type: 'Executive Suite Room', floor: 2 },
    { roomNumber: '311', type: 'Deluxe Room', floor: 2 },
    { roomNumber: '312', type: 'Deluxe Room', floor: 2 },

    { roomNumber: '101', type: 'Standard Room', floor: 0 },
    { roomNumber: '102', type: 'Family Room', floor: 0 },
    { roomNumber: '103', type: 'Executive Suite Room', floor: 0 },
    { roomNumber: '104', type: 'Executive Suite Room', floor: 0 },
    { roomNumber: '105', type: 'Deluxe Room', floor: 0 },
    { roomNumber: '106', type: 'Deluxe Room', floor: 0 },
    { roomNumber: '107', type: 'Deluxe Room', floor: 0 },
    { roomNumber: '108', type: 'Deluxe Room', floor: 0 },
    { roomNumber: '109', type: 'Standard Room', floor: 0 },
    { roomNumber: '110', type: 'Standard Room', floor: 0 },
];

async function main() {
    console.log('Ensuring categories exist...');
    const catMap = new Map();
    for (const c of categories) {
        const fallbackName = c.name === 'Standard' ? 'Standard Room' : c.name;
        const cat = await prisma.roomCategory.upsert({
            where: { name: fallbackName },
            update: {},
            create: { name: fallbackName, basePrice: c.basePrice },
        });
        catMap.set(fallbackName, cat.id);
    }

    console.log('Cleaning up obsolete rooms...');
    const oldRooms = await prisma.room.findMany();
    const newRoomNumbers = rooms.map(r => r.roomNumber);

    for (const oldRoom of oldRooms) {
        if (!newRoomNumbers.includes(oldRoom.roomNumber) && !oldRoom.roomNumber.startsWith('ARCHIVED-')) {
            try {
                await prisma.room.delete({ where: { id: oldRoom.id } });
                console.log(`Deleted obsolete room ${oldRoom.roomNumber}`);
            } catch (e) {
                await prisma.room.update({
                    where: { id: oldRoom.id },
                    data: { roomNumber: `ARCHIVED-${oldRoom.roomNumber}`, status: 'MAINTENANCE' }
                });
                console.log(`Archived obsolete room ${oldRoom.roomNumber} due to constraints`);
            }
        }
    }

    console.log('Upserting the 34 rooms...');
    for (const r of rooms) {
        const categoryId = catMap.get(r.type);
        if (!categoryId) { throw new Error(`Missing category mapping for ${r.type}`); }
        await prisma.room.upsert({
            where: { roomNumber: r.roomNumber },
            update: { categoryId, floor: r.floor },
            create: { roomNumber: r.roomNumber, categoryId, floor: r.floor, status: 'AVAILABLE' }
        });
    }

    console.log('Successfully configured 34 rooms!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
